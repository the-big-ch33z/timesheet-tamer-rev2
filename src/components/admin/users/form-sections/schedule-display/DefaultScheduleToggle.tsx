
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";
import { UserEditFormValues } from "../../hooks/useEditUserForm";

interface DefaultScheduleToggleProps {
  control: Control<UserEditFormValues>;
  onChange?: (checked: boolean) => void;
}

export const DefaultScheduleToggle: React.FC<DefaultScheduleToggleProps> = ({ 
  control,
  onChange 
}) => {
  return (
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
                if (onChange) {
                  onChange(checked);
                }
                // Add console log for debugging
                console.log(`Schedule toggle: ${checked ? 'using default' : 'using custom'} schedule`);
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
