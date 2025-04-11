
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkDayConfiguration } from "./WorkDayConfiguration";
import { WeekDay, WorkSchedule } from "@/types";

interface WeekConfigurationProps {
  weekDays: WeekDay[];
  activeWeek: 1 | 2;
  setActiveWeek: (week: 1 | 2) => void;
  editingSchedule: WorkSchedule;
  updateWorkDay: (day: WeekDay, isWorkDay: boolean) => void;
  updateWorkHours: (day: WeekDay, field: 'startTime' | 'endTime', value: string) => void;
  toggleRdoDay: (day: WeekDay) => void;
}

export const WeekConfiguration: React.FC<WeekConfigurationProps> = ({
  weekDays,
  activeWeek,
  setActiveWeek,
  editingSchedule,
  updateWorkDay,
  updateWorkHours,
  toggleRdoDay,
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Working Days & Hours</h3>
      
      <div className="flex justify-between items-center mb-4">
        <Tabs 
          value={String(activeWeek)}
          onValueChange={(value) => setActiveWeek(Number(value) as 1 | 2)}
          className="w-[200px]"
        >
          <TabsList>
            <TabsTrigger value="1">Week 1</TabsTrigger>
            <TabsTrigger value="2">Week 2</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="space-y-4">
        {weekDays.map((day) => (
          <WorkDayConfiguration
            key={day}
            day={day}
            activeWeek={activeWeek}
            editingSchedule={editingSchedule}
            updateWorkDay={updateWorkDay}
            updateWorkHours={updateWorkHours}
            toggleRdoDay={toggleRdoDay}
          />
        ))}
      </div>
    </div>
  );
};
