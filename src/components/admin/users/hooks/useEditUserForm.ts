
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
  // Access toast for notifications
  const { toast } = useToast();
  
  // Access work schedule context to get schedules
  const { getAllSchedules } = useWorkSchedule();
  
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

  // Initialize form values when selected user changes
  useFormInitialization({ 
    selectedUser, 
    setValue: form.setValue 
  });

  // Handle schedule-related calculations
  const { calculateFinalHours } = useScheduleValues({ 
    watch: form.watch,
    setValue: form.setValue
  });

  // Handle form submission
  const handleSubmit = async (values: UserEditFormValues) => {
    if (!selectedUser) return;
    
    try {
      console.log("Submitting form with values:", values);
      
      // Update fortnightHours with the calculated value based on schedule and FTE
      values.fortnightHours = calculateFinalHours();
      console.log(`Final submission hours: ${values.fortnightHours}`);
      
      // Ensure scheduleId is properly set for submission
      if (values.useDefaultSchedule) {
        values.scheduleId = 'default';
      } else if (!values.scheduleId) {
        // If no custom schedule was selected but useDefaultSchedule is false,
        // this is an error state - fallback to default
        console.warn("No schedule selected but useDefaultSchedule is false. Using default schedule.");
        values.scheduleId = 'default';
        values.useDefaultSchedule = true;
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
      
      // Close the form
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
