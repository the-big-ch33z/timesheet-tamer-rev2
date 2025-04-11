
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WorkSchedule } from "@/types";

interface ScheduleSelectorProps {
  schedules: WorkSchedule[];
  selectedScheduleId: string;
  editingSchedule: WorkSchedule;
  onScheduleChange: (scheduleId: string) => void;
  onNameChange: (name: string) => void;
}

export const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({
  schedules,
  selectedScheduleId,
  editingSchedule,
  onScheduleChange,
  onNameChange,
}) => {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Select Schedule</Label>
        <Select value={selectedScheduleId} onValueChange={onScheduleChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {schedules.map((schedule) => (
              <SelectItem key={schedule.id} value={schedule.id}>
                {schedule.name}
                {schedule.isDefault ? " (Default)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Schedule Name</Label>
        <Input
          value={editingSchedule.name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={editingSchedule.isDefault}
        />
        {editingSchedule.isDefault && (
          <p className="text-xs text-muted-foreground mt-1">
            The default schedule name cannot be changed.
          </p>
        )}
      </div>
    </div>
  );
};
