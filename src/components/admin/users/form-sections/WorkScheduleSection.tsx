
import React from "react";
import { Control, UseFormWatch } from "react-hook-form";
import { WorkSchedule } from "@/types";
import { UserEditFormValues } from "../hooks/useEditUserForm";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { DefaultScheduleToggle } from "./schedule-display/DefaultScheduleToggle";
import { ScheduleSelector } from "./schedule-display/ScheduleSelector";
import { ScheduleDisplay } from "./schedule-display/ScheduleDisplay";
import { useScheduleCalculation } from "../hooks/useScheduleCalculation";

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
  
  // Calculate schedule hours
  const { baseScheduleHours, adjustedHours } = useScheduleCalculation({
    useDefaultSchedule,
    selectedScheduleId,
    fte,
    schedules,
    defaultSchedule
  });
  
  // Log state changes in the form
  React.useEffect(() => {
    console.log("Schedule selection state:", {
      useDefault: useDefaultSchedule,
      selectedId: selectedScheduleId,
      fte: fte,
      baseHours: baseScheduleHours,
      adjustedHours: adjustedHours
    });
  }, [useDefaultSchedule, selectedScheduleId, baseScheduleHours, adjustedHours, fte]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Work Schedule</h3>
      
      <DefaultScheduleToggle control={control} />

      {!useDefaultSchedule && (
        <div className="space-y-4">
          <ScheduleSelector 
            control={control} 
            schedules={schedules} 
          />

          {selectedScheduleId && (
            <ScheduleDisplay
              selectedScheduleId={selectedScheduleId}
              schedules={schedules}
              baseScheduleHours={baseScheduleHours}
              fte={fte}
              adjustedHours={adjustedHours}
              useDefaultSchedule={false}
              defaultSchedule={defaultSchedule}
            />
          )}
        </div>
      )}

      {useDefaultSchedule && baseScheduleHours !== null && (
        <ScheduleDisplay
          selectedScheduleId={undefined}
          schedules={schedules}
          baseScheduleHours={baseScheduleHours}
          fte={fte}
          adjustedHours={adjustedHours}
          useDefaultSchedule={true}
          defaultSchedule={defaultSchedule}
        />
      )}
    </div>
  );
};
