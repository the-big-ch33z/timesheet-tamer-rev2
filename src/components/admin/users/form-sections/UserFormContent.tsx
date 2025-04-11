
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { WorkSchedule } from "@/types";
import { RoleSelection } from "./RoleSelection";
import { UserMetricsFields } from "./UserMetricsFields";
import { WorkScheduleSection } from "./WorkScheduleSection";
import { UserEditFormValues } from "../hooks/useEditUserForm";

interface UserFormContentProps {
  form: UseFormReturn<UserEditFormValues>;
  schedules: WorkSchedule[];
}

export const UserFormContent: React.FC<UserFormContentProps> = ({ form, schedules }) => {
  return (
    <>
      {/* Role selection */}
      <RoleSelection control={form.control} />
      
      {/* User Metrics Fields */}
      <UserMetricsFields control={form.control} />
      
      {/* Work Schedule section */}
      <WorkScheduleSection 
        control={form.control} 
        watch={form.watch} 
        schedules={schedules} 
      />
    </>
  );
};
