
import React, { useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { WorkSchedule } from "@/types";
import { Control, UseFormWatch, useFormState } from "react-hook-form";
import { UserEditFormValues } from "../EditUserForm";

interface WorkScheduleSectionProps {
  control: Control<UserEditFormValues>;
  watch: UseFormWatch<UserEditFormValues>;
  schedules: WorkSchedule[];
}

export const WorkScheduleSection: React.FC<WorkScheduleSectionProps> = ({ 
  control, 
  watch,
  schedules
}) => {
  // Get the current value of useDefaultSchedule
  const useDefaultSchedule = watch("useDefaultSchedule");
  const selectedScheduleId = watch("scheduleId");
  
  // Watch form state for debugging
  const formState = useFormState({ control });
  
  // Log state changes in the form
  useEffect(() => {
    console.log("Schedule selection state:", {
      useDefault: useDefaultSchedule,
      selectedId: selectedScheduleId,
      formErrors: formState.errors
    });
  }, [useDefaultSchedule, selectedScheduleId, formState]);

  // Filter out default schedule from the dropdown
  const availableSchedules = schedules.filter(s => !s.isDefault);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Work Schedule</h3>
      
      <FormField
        control={control}
        name="useDefaultSchedule"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Use Default Schedule</FormLabel>
              <FormDescription>
                Use the organization's default work schedule
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  // Add console log for debugging
                  console.log(`Switch toggled to ${checked ? 'default' : 'custom'} schedule`);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {!useDefaultSchedule && (
        <div className="space-y-4">
          <FormField
            control={control}
            name="scheduleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Schedule</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
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

          {selectedScheduleId && (
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2">Schedule Preview</h4>
              <div className="bg-gray-50 p-4 rounded border text-sm">
                {schedules.find(s => s.id === selectedScheduleId) ? (
                  <div>
                    <p className="font-medium">{schedules.find(s => s.id === selectedScheduleId)?.name}</p>
                    <p className="text-muted-foreground mt-1">
                      This schedule has specific hours defined for each day across a two-week rotation.
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Select a schedule to see details</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
