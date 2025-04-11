
import React from "react";
import { WorkSchedule } from "@/types";
import { SchedulePreview } from "./SchedulePreview";

interface ScheduleDisplayProps {
  selectedScheduleId: string | undefined;
  schedules: WorkSchedule[];
  baseScheduleHours: number | null;
  fte: number;
  adjustedHours: number | null;
  useDefaultSchedule: boolean;
  defaultSchedule: WorkSchedule;
}

export const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({
  selectedScheduleId,
  schedules,
  baseScheduleHours,
  fte,
  adjustedHours,
  useDefaultSchedule,
  defaultSchedule
}) => {
  // If using default schedule
  if (useDefaultSchedule) {
    return (
      <div className="pt-2">
        <h4 className="text-sm font-medium mb-2">Default Schedule</h4>
        <div className="bg-gray-50 p-4 rounded border text-sm">
          <SchedulePreview
            schedule={defaultSchedule}
            baseScheduleHours={baseScheduleHours}
            fte={fte}
            adjustedHours={adjustedHours}
            isDefaultSchedule={true}
          />
        </div>
      </div>
    );
  }

  // If using custom schedule
  if (selectedScheduleId) {
    const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);

    return (
      <div className="pt-2">
        <h4 className="text-sm font-medium mb-2">Schedule Preview</h4>
        <div className="bg-gray-50 p-4 rounded border text-sm">
          <SchedulePreview
            schedule={selectedSchedule}
            baseScheduleHours={baseScheduleHours}
            fte={fte}
            adjustedHours={adjustedHours}
          />
        </div>
      </div>
    );
  }

  return null;
};
