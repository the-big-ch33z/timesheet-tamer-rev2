
import React from "react";
import { Badge } from "@/components/ui/badge";
import { WorkSchedule } from "@/types";

interface SchedulePreviewProps {
  schedule: WorkSchedule | undefined;
  baseScheduleHours: number | null;
  fte: number;
  adjustedHours: number | null;
  isDefaultSchedule?: boolean;
}

export const SchedulePreview: React.FC<SchedulePreviewProps> = ({
  schedule,
  baseScheduleHours,
  fte,
  adjustedHours,
  isDefaultSchedule = false
}) => {
  if (!schedule) {
    return (
      <p className="text-muted-foreground">Select a schedule to see details</p>
    );
  }

  return (
    <div>
      <p className="font-medium">{schedule.name}</p>
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
        {isDefaultSchedule 
          ? "This is the organization's default work schedule."
          : "This schedule has specific hours defined for each day across a two-week rotation."}
      </p>
    </div>
  );
};
