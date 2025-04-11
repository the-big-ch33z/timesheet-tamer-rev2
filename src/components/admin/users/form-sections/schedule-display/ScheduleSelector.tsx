
import React from "react";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkSchedule } from "@/types";
import { UserEditFormValues } from "../../hooks/useEditUserForm";

interface ScheduleSelectorProps {
  control: Control<UserEditFormValues>;
  schedules: WorkSchedule[];
  onChange?: (value: string) => void;
}

export const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({ 
  control, 
  schedules,
  onChange
}) => {
  // Filter out default schedule from the dropdown
  const availableSchedules = schedules.filter(s => !s.isDefault);

  return (
    <FormField
      control={control}
      name="scheduleId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Assigned Schedule</FormLabel>
          <Select
            onValueChange={(value) => {
              field.onChange(value);
              if (onChange) {
                onChange(value);
              }
              console.log(`Selected schedule: ${value}`);
            }}
            value={field.value || ''}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableSchedules.map((schedule) => (
                <SelectItem key={schedule.id} value={schedule.id}>
                  {schedule.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
