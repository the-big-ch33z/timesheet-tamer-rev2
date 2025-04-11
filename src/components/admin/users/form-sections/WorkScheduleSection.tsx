
import React, { useEffect, useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { WorkSchedule } from "@/types";
import { Control, UseFormWatch, useFormState } from "react-hook-form";
import { UserEditFormValues } from "../hooks/useEditUserForm";
import { Badge } from "@/components/ui/badge";
import { calculateFortnightHoursFromSchedule } from "@/components/timesheet/utils/scheduleUtils";
import { useWorkSchedule } from "@/contexts/work-schedule";

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
  // Get the current values from the form
  const useDefaultSchedule = watch("useDefaultSchedule");
  const selectedScheduleId = watch("scheduleId");
  const fte = watch("fte");
  
  // Get access to the default schedule
  const { defaultSchedule } = useWorkSchedule();
  
  // Watch form state for debugging
  const formState = useFormState({ control });
  
  // Calculate fortnight hours for the selected schedule
  const [baseScheduleHours, setBaseScheduleHours] = useState<number | null>(null);
  const [adjustedHours, setAdjustedHours] = useState<number | null>(null);
  
  // Update hours calculations when schedule selection or FTE changes
  useEffect(() => {
    let baseHours = 0;
    
    if (useDefaultSchedule) {
      // Calculate hours from default schedule
      baseHours = calculateFortnightHoursFromSchedule(defaultSchedule);
    } else if (selectedScheduleId) {
      const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
      if (selectedSchedule) {
        baseHours = calculateFortnightHoursFromSchedule(selectedSchedule);
      }
    }
    
    if (baseHours > 0) {
      setBaseScheduleHours(baseHours);
      
      // Apply FTE to calculate adjusted hours
      const calculatedAdjustedHours = baseHours * fte;
      // Round to nearest 0.5
      const roundedHours = Math.round(calculatedAdjustedHours * 2) / 2;
      setAdjustedHours(roundedHours);
    } else {
      setBaseScheduleHours(null);
      setAdjustedHours(null);
    }
  }, [selectedScheduleId, useDefaultSchedule, schedules, defaultSchedule, fte]);
  
  // Log state changes in the form
  useEffect(() => {
    console.log("Schedule selection state:", {
      useDefault: useDefaultSchedule,
      selectedId: selectedScheduleId,
      formErrors: formState.errors,
      fte: fte,
      baseHours: baseScheduleHours,
      adjustedHours: adjustedHours
    });
  }, [useDefaultSchedule, selectedScheduleId, formState, baseScheduleHours, adjustedHours, fte]);

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
                    {baseScheduleHours !== null && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center">
                          <p className="text-muted-foreground">Base Schedule Hours:</p>
                          <Badge variant="outline" className="ml-2">
                            {baseScheduleHours} hours
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <p className="text-muted-foreground">Current FTE:</p>
                          <Badge variant="outline" className="ml-2">
                            {fte} ({Math.round(fte * 100)}%)
                          </Badge>
                        </div>
                        <div className="flex items-center font-medium">
                          <p className="text-muted-foreground">Required Fortnight Hours:</p>
                          <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">
                            {adjustedHours} hours
                          </Badge>
                        </div>
                      </div>
                    )}
                    <p className="text-muted-foreground mt-3">
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

      {useDefaultSchedule && baseScheduleHours !== null && (
        <div className="pt-2">
          <h4 className="text-sm font-medium mb-2">Default Schedule</h4>
          <div className="bg-gray-50 p-4 rounded border text-sm">
            <div>
              <p className="font-medium">{defaultSchedule.name}</p>
              <div className="space-y-2 mt-2">
                <div className="flex items-center">
                  <p className="text-muted-foreground">Base Schedule Hours:</p>
                  <Badge variant="outline" className="ml-2">
                    {baseScheduleHours} hours
                  </Badge>
                </div>
                <div className="flex items-center">
                  <p className="text-muted-foreground">Current FTE:</p>
                  <Badge variant="outline" className="ml-2">
                    {fte} ({Math.round(fte * 100)}%)
                  </Badge>
                </div>
                <div className="flex items-center font-medium">
                  <p className="text-muted-foreground">Required Fortnight Hours:</p>
                  <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">
                    {adjustedHours} hours
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground mt-3">
                This is the organization's default work schedule.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
