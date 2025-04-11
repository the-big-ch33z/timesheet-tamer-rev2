
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimesheetCalendar from "./TimesheetCalendar";
import MonthlyHours from "./MonthlyHours";
import RecentEntries from "./RecentEntries";
import ToilSummary from "./ToilSummary";
import { TimeEntry, WorkSchedule } from "@/types";

interface TimesheetTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  entries: TimeEntry[];
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
  workSchedule?: WorkSchedule; // Added workSchedule prop
}

const TimesheetTabs = ({
  activeTab,
  setActiveTab,
  entries,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  workSchedule, // Add workSchedule prop
}: TimesheetTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
      <TabsList className="mb-4">
        <TabsTrigger value="timesheet">Calendar View</TabsTrigger>
        <TabsTrigger value="monthly">Monthly Hours</TabsTrigger>
        <TabsTrigger value="recent">Recent Entries</TabsTrigger>
        <TabsTrigger value="toil">TOIL Summary</TabsTrigger>
      </TabsList>

      <TabsContent value="timesheet">
        <TimesheetCalendar 
          currentMonth={currentMonth}
          entries={entries}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onDayClick={onDayClick}
          workSchedule={workSchedule} // Pass workSchedule to TimesheetCalendar
        />
      </TabsContent>

      <TabsContent value="monthly">
        <MonthlyHours 
          entries={entries} // This was causing an error
        />
      </TabsContent>

      <TabsContent value="recent">
        <RecentEntries 
          entries={entries} // This was causing an error - onDayClick was improperly passed
        />
      </TabsContent>

      <TabsContent value="toil">
        <ToilSummary 
          entries={entries} // This was causing an error
        />
      </TabsContent>
    </Tabs>
  );
};

export default TimesheetTabs;
