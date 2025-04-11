
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import TimesheetCalendar from "./TimesheetCalendar";
import ToilSummary from "./ToilSummary";
import MonthlyHours from "./MonthlyHours";
import RecentEntries from "./RecentEntries";
import { useTabContent } from "./hooks/useTabContent";
import { useTimesheetContext } from "@/contexts/timesheet";

const TabContent = () => {
  const { 
    currentMonth, 
    entries, 
    workSchedule, 
    viewedUser,
    onPrevMonth,
    onNextMonth,
    handleDayClick
  } = useTimesheetContext();

  const { sortedEntries } = useTabContent({ 
    entries, 
    currentMonth, 
    workSchedule, 
    user: viewedUser
  });

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
              onDayClick={handleDayClick}
              workSchedule={workSchedule}
            />
          </div>

          <div className="space-y-6">
            <MonthlyHours 
              entries={entries} 
              user={viewedUser} 
              currentMonth={currentMonth} 
              workSchedule={workSchedule}
            />
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
