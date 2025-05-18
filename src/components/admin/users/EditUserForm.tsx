// --- File: src/components/admin/users/hooks/useEditUserForm.ts ---

import { useForm } from "react-hook-form";
import { UserEditFormValues } from "../form-sections/UserFormContent";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { useUserManagement } from "./useUserManagement";
import { useEffect } from "react";
import { User } from "@/types";

interface UseEditUserFormProps {
  selectedUser: User | null;
  onSubmit: (data: UserEditFormValues) => void;
  onOpenChange: (open: boolean) => void;
}

export const useEditUserForm = ({
  selectedUser,
  onSubmit,
  onOpenChange,
}: UseEditUserFormProps) => {
  const { assignScheduleToUser, schedules } = useWorkSchedule();
  const { updateUserMetrics, updateUserRole } = useUserManagement();

  const form = useForm<UserEditFormValues>({
    defaultValues: {
      name: "",
      email: "",
      role: "team-member",
      metrics: {},
      scheduleId: "default",
    },
  });

  // Prepopulate the form when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      form.reset({
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        role: selectedUser.role || "team-member",
        metrics: selectedUser.metrics || {},
        scheduleId: selectedUser.workScheduleId || "default",
      });
    }
  }, [selectedUser, form]);

  // 🔧 Ensures workSchedule assignment comes after metrics and role updates
  const handleSubmit = async (data: UserEditFormValues) => {
    if (!selectedUser) return;

    try {
      await updateUserRole(selectedUser.id, data.role);
      await updateUserMetrics(selectedUser.id, data.metrics);
      await assignScheduleToUser(selectedUser.id, data.scheduleId);

      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  return {
    form,
    schedules,
    handleSubmit,
  };
};
