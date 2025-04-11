
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { TimeEntry, WorkSchedule } from "@/types";
import TimesheetCalendar from "./TimesheetCalendar";
import ToilSummary from "./ToilSummary";
import MonthlyHours from "./MonthlyHours";
import RecentEntries from "./RecentEntries";

interface TabContentProps {
  entries: TimeEntry[];
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
  workSchedule?: WorkSchedule;
}

const TabContent: React.FC<TabContentProps> = ({
  entries,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  workSchedule,
}) => {
  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <TabsContent value="timesheet" className="mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TimesheetCalendar 
              currentMonth={currentMonth}
              entries={entries}
              onPrevMonth={onPrevMonth}
              onNextMonth={onNextMonth}
              onDayClick={onDayClick}
              workSchedule={workSchedule}
            />
          </div>

          <div className="space-y-6">
            <MonthlyHours entries={entries} />
            <ToilSummary entries={entries} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="recent">
        <div className="bg-gray-50 p-8 rounded-lg">
          <h3 className="text-xl font-medium mb-4">Recent Time Entries</h3>
          <RecentEntries entries={sortedEntries} />
        </div>
      </TabsContent>
    </>
  );
};

export default TabContent;
