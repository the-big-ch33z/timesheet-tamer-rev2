
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { WorkSchedule, WeekDay } from "@/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Coffee, Bell } from "lucide-react";

interface WorkDayConfigurationProps {
  day: WeekDay;
  activeWeek: 1 | 2;
  editingSchedule: WorkSchedule;
  updateWorkDay: (day: WeekDay, isWorkDay: boolean) => void;
  updateWorkHours: (day: WeekDay, field: 'startTime' | 'endTime', value: string) => void;
  toggleRdoDay: (day: WeekDay) => void;
  toggleBreak: (day: WeekDay, breakType: 'lunch' | 'smoko') => void;
}

export const WorkDayConfiguration: React.FC<WorkDayConfigurationProps> = ({
  day,
  activeWeek,
  editingSchedule,
  updateWorkDay,
  updateWorkHours,
  toggleRdoDay,
  toggleBreak
}) => {
  const isWorkDay = editingSchedule.weeks[activeWeek][day] !== null;
  const dayConfig = editingSchedule.weeks[activeWeek][day];
  const breaks = dayConfig?.breaks || {
    lunch: false,
    smoko: false
  };
  
  // Use activeWeek specifically for displaying and tracking RDO days
  const isRdoDay = editingSchedule.rdoDays[activeWeek].includes(day);

  return <div key={`${activeWeek}-${day}`} className="flex items-center flex-wrap gap-4">
      <div className="w-28 capitalize">{day}</div>
      <div className="flex items-center gap-2">
        <Switch checked={isWorkDay} onCheckedChange={checked => updateWorkDay(day, checked)} />
        <span className="text-sm text-gray-500">
          {isWorkDay ? 'Working Day' : 'Day Off'}
        </span>
      </div>

      {isWorkDay && <>
          <div className="flex items-center gap-2 ml-4">
            <Label htmlFor={`start-${activeWeek}-${day}`} className="w-20 text-sm">Start Time</Label>
            <Input id={`start-${activeWeek}-${day}`} type="time" value={dayConfig?.startTime} onChange={e => updateWorkHours(day, 'startTime', e.target.value)} className="w-24" />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor={`end-${activeWeek}-${day}`} className="w-20 text-sm">End Time</Label>
            <Input id={`end-${activeWeek}-${day}`} type="time" value={dayConfig?.endTime} onChange={e => updateWorkHours(day, 'endTime', e.target.value)} className="w-24" />
          </div>

          <div className="flex items-center gap-4 ml-4">
            <ToggleGroup type="multiple" variant="outline" size="sm">
              <ToggleGroupItem value="lunch" aria-label="Toggle lunch break" data-state={breaks.lunch ? "on" : "off"} onClick={() => toggleBreak(day, 'lunch')} className="rounded-sm font-normal bg-lime-100">
                <Bell className="h-4 w-4 mr-1" />
                <span className="text-xs">Lunch</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="smoko" aria-label="Toggle smoko break" data-state={breaks.smoko ? "on" : "off"} onClick={() => toggleBreak(day, 'smoko')} className="bg-yellow-200 hover:bg-yellow-100 rounded-sm">
                <Coffee className="h-4 w-4 mr-1" />
                <span className="text-xs">Smoko</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Label htmlFor={`rdo-${activeWeek}-${day}`} className="text-sm">RDO</Label>
            <Switch id={`rdo-${activeWeek}-${day}`} checked={isRdoDay} onCheckedChange={() => toggleRdoDay(day)} />
          </div>
        </>}
    </div>;
};
