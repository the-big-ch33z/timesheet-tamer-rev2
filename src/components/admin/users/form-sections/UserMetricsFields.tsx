
import React from "react";
import { FormField, FormItem, FormLabel, FormDescription, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { UserEditFormValues } from "../EditUserForm";
import { FORM_PLACEHOLDERS } from "@/constants/defaults";

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
                placeholder={FORM_PLACEHOLDERS.FTE}
                {...field}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  field.onChange(value);
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
                placeholder={FORM_PLACEHOLDERS.FORTNIGHT_HOURS}
                {...field}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  field.onChange(value);
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
