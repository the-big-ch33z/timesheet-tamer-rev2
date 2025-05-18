
import { User } from "@/types";
import { useAuth } from "@/contexts/auth";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { useToast } from "@/hooks/use-toast";
import { UserEditFormValues } from "./useEditUserForm";
import { calculateFortnightHoursFromSchedule } from "@/components/timesheet/utils/scheduleUtils";

export const useEditUserSubmission = (
  selectedUser: User | null, 
  onSuccess: () => void
) => {
  const { toast } = useToast();
  
  // Access authentication and work schedule contexts
  const { updateUserRole, updateUserMetrics } = useAuth();
  const { assignScheduleToUser, getScheduleById, defaultSchedule } = useWorkSchedule();

  const onSubmitEditUser = async (data: UserEditFormValues) => {
    if (!selectedUser) return;
    
    try {
      console.log("Updating user with data:", data);
      
      // Calculate the actual fortnight hours based on FTE and schedule
      let baseHours = 0;
      let scheduleId = data.scheduleId || 'default';
      
      if (data.useDefaultSchedule) {
        baseHours = calculateFortnightHoursFromSchedule(defaultSchedule);
        scheduleId = 'default'; // Ensure we use default ID
      } else if (data.scheduleId) {
        const selectedSchedule = getScheduleById(data.scheduleId);
        if (selectedSchedule) {
          baseHours = calculateFortnightHoursFromSchedule(selectedSchedule);
        }
      }
      
      // Apply FTE to calculate the proportional hours
      let actualFortnightHours = data.fortnightHours; // Default to the form value
      
      if (baseHours > 0) {
        const adjustedHours = baseHours * data.fte;
        // Round to nearest 0.5
        actualFortnightHours = Math.round(adjustedHours * 2) / 2;
        console.log(`Final fortnight hours calculation: base=${baseHours}, FTE=${data.fte}, adjusted=${actualFortnightHours}`);
      }
      
      // First update user role
      await updateUserRole(selectedUser.id, data.role);
      
      // Then update user metrics WITHOUT the workScheduleId
      await updateUserMetrics(selectedUser.id, {
        fte: data.fte,
        fortnightHours: actualFortnightHours
        // Removed workScheduleId from here
      });
      
      // Finally, use assignScheduleToUser to properly set the schedule
      // This ensures all the proper events are triggered and localStorage is updated
      await assignScheduleToUser(selectedUser.id, scheduleId);
      
      // Call the success callback
      onSuccess();
      
      toast({
        title: "User Updated",
        description: `${selectedUser.name}'s details have been updated.`,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error Updating User",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return { onSubmitEditUser };
};
