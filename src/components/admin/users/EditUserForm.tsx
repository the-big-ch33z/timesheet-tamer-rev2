
import React, { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UserRole, User } from "@/types";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { RoleSelection } from "./form-sections/RoleSelection";
import { UserMetricsFields } from "./form-sections/UserMetricsFields";
import { WorkScheduleSection } from "./form-sections/WorkScheduleSection";
import { useToast } from "@/hooks/use-toast";
import { USER_DEFAULTS } from "@/constants/defaults";
import { calculateFortnightHoursFromSchedule } from "@/components/timesheet/utils/scheduleUtils";

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
  // Toast for notifications
  const { toast } = useToast();
  
  // Access work schedule context
  const { getAllSchedules, getScheduleById, defaultSchedule } = useWorkSchedule();
  
  // Get all available schedules
  const schedules = getAllSchedules();
  
  // Setup form for editing a user
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

  // Watch for changes to useDefaultSchedule and scheduleId
  const useDefaultSchedule = form.watch("useDefaultSchedule");
  const scheduleId = form.watch("scheduleId");
  
  // Update fortnight hours based on schedule selection
  useEffect(() => {
    if (useDefaultSchedule) {
      // When using default schedule, calculate hours from the default schedule
      const calculatedHours = calculateFortnightHoursFromSchedule(defaultSchedule);
      if (calculatedHours > 0) {
        console.log(`Updating fortnight hours from default schedule: ${calculatedHours}`);
        form.setValue("fortnightHours", calculatedHours);
      }
    } else if (scheduleId) {
      // When using custom schedule
      const selectedSchedule = getScheduleById(scheduleId);
      if (selectedSchedule) {
        const calculatedHours = calculateFortnightHoursFromSchedule(selectedSchedule);
        if (calculatedHours > 0) {
          console.log(`Updating fortnight hours from custom schedule: ${calculatedHours}`);
          form.setValue("fortnightHours", calculatedHours);
        }
      }
    }
  }, [useDefaultSchedule, scheduleId, getScheduleById, form, defaultSchedule]);

  // Update form when selected user changes
  useEffect(() => {
    if (selectedUser) {
      console.log("Initializing form with user data:", selectedUser);
      
      form.setValue("role", selectedUser.role);
      form.setValue("teamIds", selectedUser.teamIds || []);
      
      // Determine if user has a custom schedule
      const hasCustomSchedule = selectedUser.workScheduleId && 
                               selectedUser.workScheduleId !== 'default' && 
                               selectedUser.workScheduleId !== undefined;
                               
      console.log(`User ${selectedUser.name} has custom schedule: ${hasCustomSchedule}, ID: ${selectedUser.workScheduleId}`);
      
      // Set the form values
      form.setValue("useDefaultSchedule", !hasCustomSchedule);
      
      if (hasCustomSchedule) {
        form.setValue("scheduleId", selectedUser.workScheduleId || undefined);
        console.log(`Setting schedule ID in form to: ${selectedUser.workScheduleId}`);
      } else {
        form.setValue("scheduleId", undefined);
      }
      
      // Set FTE and fortnight hours with proper type conversion, fallback to defaults if undefined
      form.setValue("fte", selectedUser.fte !== undefined ? selectedUser.fte : USER_DEFAULTS.FTE);
      form.setValue("fortnightHours", selectedUser.fortnightHours !== undefined ? selectedUser.fortnightHours : USER_DEFAULTS.FORTNIGHT_HOURS);
      console.log(`Initializing fortnightHours to: ${selectedUser.fortnightHours ?? USER_DEFAULTS.FORTNIGHT_HOURS}`);
    }
  }, [selectedUser, form]);

  const handleSubmit = async (values: UserEditFormValues) => {
    if (!selectedUser) return;
    
    try {
      console.log("Submitting form with values:", values);
      
      // Submit all form values
      await onSubmit(values);
      
      // Show success toast notification
      toast({
        title: "User updated successfully",
        description: `${selectedUser.name}'s information has been updated.`,
        variant: "default",
        className: "bg-green-50 border-green-200"
      });
      
      onOpenChange(false);
    } catch (error) {
      // Show error toast notification
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
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
