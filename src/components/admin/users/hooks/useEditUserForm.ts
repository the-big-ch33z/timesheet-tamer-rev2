import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "@/types";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { USER_DEFAULTS } from "@/constants/defaults";
import { useToast } from "@/hooks/use-toast";
import { useFormInitialization } from "./useFormInitialization";
import { useScheduleValues } from "./useScheduleValues";

// Form schema for editing a user
const userEditSchema = z.object({
  role: z.enum(["admin", "manager", "team-member"] as const),
  teamIds: z.array(z.string()).optional(),
  useDefaultSchedule: z.boolean().default(true),
  scheduleId: z.string().optional(),
  fte: z.coerce.number().min(0).max(1).default(USER_DEFAULTS.FTE),
  fortnightHours: z.coerce.number().min(0).default(USER_DEFAULTS.FORTNIGHT_HOURS),
});

export type UserEditFormValues = z.infer<typeof userEditSchema>;

interface UseEditUserFormProps {
  selectedUser: User | null;
  onSubmit: (data: UserEditFormValues) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export const useEditUserForm = ({ selectedUser, onSubmit, onOpenChange }: UseEditUserFormProps) => {
  const { toast } = useToast();
  const { getAllSchedules, assignScheduleToUser } = useWorkSchedule();
  const schedules = getAllSchedules();

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      role: "team-member",
      teamIds: [],
      useDefaultSchedule: true,
      scheduleId: undefined,
      fte: USER_DEFAULTS.FTE,
      fortnightHours: USER_DEFAULTS.FORTNIGHT_HOURS,
    },
  });

  useFormInitialization({
    selectedUser,
    setValue: form.setValue,
  });

  const { calculateFinalHours } = useScheduleValues({
    watch: form.watch,
    setValue: form.setValue,
  });

  const handleSubmit = async (values: UserEditFormValues) => {
    if (!selectedUser) return;

    try {
      console.log("Submitting form with values:", values);

      values.fortnightHours = calculateFinalHours();
      console.log(`Final submission hours: ${values.fortnightHours}`);

      // ⬇️ Persist form changes via parent-provided handler
      await onSubmit(values);

      // ⬇️ Persist the schedule assignment to user
      const resolvedScheduleId = values.useDefaultSchedule ? "default" : values.scheduleId;
      if (resolvedScheduleId) {
        await assignScheduleToUser(selectedUser.id, resolvedScheduleId);
      }

      toast({
        title: "User updated successfully",
        description: `${selectedUser.name}'s information has been updated.`,
        variant: "default",
        className: "bg-green-50 border-green-200",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      console.error("Error updating user:", error);
    }
  };

  return {
    form,
    schedules,
    handleSubmit,
  };
};
