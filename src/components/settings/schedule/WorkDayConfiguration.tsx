
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { WorkSchedule, WeekDay } from "@/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Coffee, Bell } from "lucide-react";
import { calculateDayHoursWithBreaks } from "@/utils/time/scheduleUtils";

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

  // --- Show daily summary hours with break info as a chip ---
  let dailyHours: number | null = null;
  if (isWorkDay && dayConfig?.startTime && dayConfig?.endTime) {
    dailyHours = calculateDayHoursWithBreaks(dayConfig.startTime, dayConfig.endTime, breaks);
  }

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
          {/* ---- Daily hours summary & break notice ---- */}
          {dailyHours !== null && (
            <div className="ml-4 flex items-center gap-2">
              <span className="text-xs rounded-full border px-2 py-0.5 font-medium bg-gray-100 text-gray-700">
                {dailyHours.toFixed(2)} hrs
              </span>
              {/* Lunch/subtraction chip */}
              {(breaks.lunch || breaks.smoko) && (
                <span className="flex items-center gap-1 text-xs">
                  {breaks.lunch && (
                    <span className="flex items-center px-[0.35em] py-[0.1em] rounded-full bg-lime-50 border border-lime-200 text-lime-600">
                      <Bell className="h-3 w-3 mr-0.5" />
                      Lunch subtracted
                    </span>
                  )}
                  {breaks.smoko && (
                    <span className="flex items-center px-[0.35em] py-[0.1em] rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 ml-1">
                      <Coffee className="h-3 w-3 mr-0.5" />
                      Smoko subtracted
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
        </>}
    </div>;
};
