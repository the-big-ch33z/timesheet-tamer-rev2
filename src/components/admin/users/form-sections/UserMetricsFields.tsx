
import React from "react";
import { FormField, FormItem, FormLabel, FormDescription, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { UserEditFormValues } from "../EditUserForm";

interface UserMetricsFieldsProps {
  control: Control<UserEditFormValues>;
}

export const UserMetricsFields: React.FC<UserMetricsFieldsProps> = ({ control }) => {
  return (
    <>
      <FormField
        control={control}
        name="fte"
        render={({ field }) => (
          <FormItem>
            <FormLabel>FTE (Full-Time Equivalent)</FormLabel>
            <FormDescription>
              Work fraction (1.0 = full-time, 0.5 = half-time)
            </FormDescription>
            <FormControl>
              <Input 
                type="number" 
                step="0.1" 
                min="0" 
                max="1"
                placeholder="1.0" 
                {...field}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  field.onChange(!isNaN(value) ? value : 0);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="fortnightHours"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Required Fortnight Hours</FormLabel>
            <FormControl>
              <Input 
                type="number"
                min="0"
                placeholder="76" 
                {...field}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  field.onChange(!isNaN(value) ? value : 0);
                  console.log(`Changed fortnightHours to: ${!isNaN(value) ? value : 0}`);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
