
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "@/types";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { USER_DEFAULTS } from "@/constants/defaults";
import { useToast } from "@/hooks/use-toast";
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

interface UseEditUserFormProps {
  selectedUser: User | null;
  onSubmit: (data: UserEditFormValues) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export const useEditUserForm = ({ selectedUser, onSubmit, onOpenChange }: UseEditUserFormProps) => {
  // Access toast for notifications
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

  // Watch for changes to useDefaultSchedule, scheduleId, and fte
  const useDefaultSchedule = form.watch("useDefaultSchedule");
  const scheduleId = form.watch("scheduleId");
  const fte = form.watch("fte");
  
  // Update fortnight hours based on schedule selection and FTE
  useEffect(() => {
    let baseHours = 0;
    
    if (useDefaultSchedule) {
      // When using default schedule, calculate hours from the default schedule
      baseHours = calculateFortnightHoursFromSchedule(defaultSchedule);
    } else if (scheduleId) {
      // When using custom schedule
      const selectedSchedule = getScheduleById(scheduleId);
      if (selectedSchedule) {
        baseHours = calculateFortnightHoursFromSchedule(selectedSchedule);
      }
    }
    
    if (baseHours > 0) {
      // Apply FTE to calculate the proportional hours
      const adjustedHours = baseHours * fte;
      // Round to nearest 0.5
      const roundedHours = Math.round(adjustedHours * 2) / 2;
      
      console.log(`Updating fortnight hours: base=${baseHours}, FTE=${fte}, adjusted=${adjustedHours}, rounded=${roundedHours}`);
      form.setValue("fortnightHours", roundedHours);
    }
  }, [useDefaultSchedule, scheduleId, fte, getScheduleById, form, defaultSchedule]);

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
      
      // Set FTE with proper type conversion, fallback to defaults if undefined
      form.setValue("fte", selectedUser.fte !== undefined ? selectedUser.fte : USER_DEFAULTS.FTE);
      
      // If user has specific fortnight hours set, use those. Otherwise, they'll be calculated
      // based on the schedule and FTE in the useEffect
      if (selectedUser.fortnightHours !== undefined) {
        form.setValue("fortnightHours", selectedUser.fortnightHours);
        console.log(`Initializing fortnightHours to user-specific value: ${selectedUser.fortnightHours}`);
      }
    }
  }, [selectedUser, form, defaultSchedule]);

  const handleSubmit = async (values: UserEditFormValues) => {
    if (!selectedUser) return;
    
    try {
      console.log("Submitting form with values:", values);
      
      // Ensure the correct fortnight hours based on schedule and FTE are submitted
      let baseHours = 0;
      
      if (values.useDefaultSchedule) {
        baseHours = calculateFortnightHoursFromSchedule(defaultSchedule);
      } else if (values.scheduleId) {
        const selectedSchedule = getScheduleById(values.scheduleId);
        if (selectedSchedule) {
          baseHours = calculateFortnightHoursFromSchedule(selectedSchedule);
        }
      }
      
      if (baseHours > 0) {
        // Apply FTE to calculate the proportional hours
        const adjustedHours = baseHours * values.fte;
        // Round to nearest 0.5
        values.fortnightHours = Math.round(adjustedHours * 2) / 2;
        console.log(`Setting final submission hours: base=${baseHours}, FTE=${values.fte}, adjusted=${values.fortnightHours}`);
      }
      
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

  return {
    form,
    schedules,
    handleSubmit
  };
};
