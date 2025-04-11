
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UserRole, User } from "@/types";
import { useWorkSchedule } from "@/contexts/work-schedule"; // Updated import path
import { RoleSelection } from "./form-sections/RoleSelection";
import { UserMetricsFields } from "./form-sections/UserMetricsFields";
import { WorkScheduleSection } from "./form-sections/WorkScheduleSection";

// Form schema for editing a user
const userEditSchema = z.object({
  role: z.enum(["admin", "manager", "team-member"] as const),
  teamIds: z.array(z.string()).optional(),
  useDefaultSchedule: z.boolean().default(true),
  scheduleId: z.string().optional(),
  fte: z.coerce.number().min(0).max(1).default(1),
  fortnightHours: z.coerce.number().min(0).default(76),
});

export type UserEditFormValues = z.infer<typeof userEditSchema>;

interface EditUserFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
  onSubmit: (data: UserEditFormValues) => Promise<void>;
}

export const EditUserForm: React.FC<EditUserFormProps> = ({
  isOpen,
  onOpenChange,
  selectedUser,
  onSubmit
}) => {
  // Access work schedule context
  const { getAllSchedules } = useWorkSchedule();
  
  // Get all available schedules
  const schedules = getAllSchedules();
  
  // Setup form for editing a user
  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      role: selectedUser?.role || "team-member",
      teamIds: selectedUser?.teamIds || [],
      useDefaultSchedule: selectedUser?.workScheduleId ? false : true,
      scheduleId: selectedUser?.workScheduleId || 'default',
      fte: selectedUser?.fte || 1.0,
      fortnightHours: selectedUser?.fortnightHours || 76,
    },
  });

  // Update form when selected user changes
  React.useEffect(() => {
    if (selectedUser) {
      form.setValue("role", selectedUser.role);
      form.setValue("teamIds", selectedUser.teamIds || []);
      
      const hasCustomSchedule = selectedUser.workScheduleId && selectedUser.workScheduleId !== 'default';
      form.setValue("useDefaultSchedule", !hasCustomSchedule);
      form.setValue("scheduleId", selectedUser.workScheduleId || 'default');
      
      // Set FTE and fortnight hours with proper type conversion
      form.setValue("fte", selectedUser.fte || 1.0);
      form.setValue("fortnightHours", selectedUser.fortnightHours || 76);
    }
  }, [selectedUser, form]);

  const handleSubmit = async (values: UserEditFormValues) => {
    if (!selectedUser) return;
    
    try {      
      // Submit all form values
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
          <SheetDescription>
            {selectedUser ? `Update details for ${selectedUser.name}` : "Update user details"}
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-6">
            {/* Role selection */}
            <RoleSelection control={form.control} />
            
            {/* User Metrics Fields */}
            <UserMetricsFields control={form.control} />
            
            {/* Work Schedule section */}
            <WorkScheduleSection 
              control={form.control} 
              watch={form.watch} 
              schedules={schedules} 
            />

            <SheetFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Update User</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
