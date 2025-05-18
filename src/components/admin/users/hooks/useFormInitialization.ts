
import { useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import { User } from "@/types";
import { UserEditFormValues } from "./useEditUserForm";
import { USER_DEFAULTS } from "@/constants/defaults";

interface UseFormInitializationProps {
  selectedUser: User | null;
  setValue: UseFormSetValue<UserEditFormValues>;
}

/**
 * Hook for initializing form values based on the selected user
 */
export const useFormInitialization = ({ selectedUser, setValue }: UseFormInitializationProps) => {
  useEffect(() => {
    if (selectedUser) {
      console.log("Initializing form with user data:", selectedUser);
      
      setValue("role", selectedUser.role);
      setValue("teamIds", selectedUser.teamIds || []);
      
      // Determine if user has a custom schedule
      // A workScheduleId value that is anything other than 'default' or undefined 
      // indicates a custom schedule
      const hasCustomSchedule = selectedUser.workScheduleId && 
                               selectedUser.workScheduleId !== 'default' && 
                               selectedUser.workScheduleId !== undefined;
                               
      console.log(`User ${selectedUser.name} has custom schedule: ${hasCustomSchedule}, ID: ${selectedUser.workScheduleId}`);
      
      // Set the form values
      setValue("useDefaultSchedule", !hasCustomSchedule);
      
      if (hasCustomSchedule) {
        // Ensure workScheduleId is treated as a string
        setValue("scheduleId", String(selectedUser.workScheduleId));
        console.log(`Setting schedule ID in form to: ${selectedUser.workScheduleId}`);
      } else {
        setValue("scheduleId", undefined);
      }
      
      // Set FTE with proper type conversion, fallback to defaults if undefined
      setValue("fte", selectedUser.fte !== undefined ? selectedUser.fte : USER_DEFAULTS.FTE);
      
      // If user has specific fortnight hours set, use those. Otherwise, they'll be calculated
      // based on the schedule and FTE in the useEffect
      if (selectedUser.fortnightHours !== undefined) {
        setValue("fortnightHours", selectedUser.fortnightHours);
        console.log(`Initializing fortnightHours to user-specific value: ${selectedUser.fortnightHours}`);
      }
    }
  }, [selectedUser, setValue]);
};
