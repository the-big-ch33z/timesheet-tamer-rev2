
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimesheetCalendar from "./TimesheetCalendar";
import RecentEntries from "./RecentEntries";
import { TimeEntry, WorkSchedule } from "@/types";
import TabContent from "./TabContent";

interface TimesheetTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  entries: TimeEntry[];
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
  workSchedule?: WorkSchedule;
}

const TimesheetTabs = ({
  activeTab,
  setActiveTab,
  entries,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  workSchedule,
}: TimesheetTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
      <TabsList className="mb-4">
        <TabsTrigger value="timesheet">Calendar View</TabsTrigger>
        <TabsTrigger value="recent">Recent Entries</TabsTrigger>
      </TabsList>

      <TabContent 
        entries={entries}
        currentMonth={currentMonth}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onDayClick={onDayClick}
        workSchedule={workSchedule}
      />
    </Tabs>
  );
};

export default TimesheetTabs;
