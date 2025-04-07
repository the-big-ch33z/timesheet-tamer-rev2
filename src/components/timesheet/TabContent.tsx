
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import TimesheetCalendar from "./TimesheetCalendar";
import ToilSummary from "./ToilSummary";
import MonthlyHours from "./MonthlyHours";

interface TabContentProps {
  entries: TimeEntry[];
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
}

const TabContent: React.FC<TabContentProps> = ({
  entries,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onDayClick,
}) => {
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
            />
          </div>

          <div className="space-y-6">
            <ToilSummary />
            <MonthlyHours />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="toil">
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <h3 className="text-xl font-medium mb-2">TOIL Records</h3>
          <p className="text-gray-500 mb-4">View and manage your Time Off In Lieu records</p>
        </div>
      </TabsContent>

      <TabsContent value="dta">
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <h3 className="text-xl font-medium mb-2">DTA Records</h3>
          <p className="text-gray-500 mb-4">View and manage your DTA records</p>
        </div>
      </TabsContent>

      <TabsContent value="recent">
        <div className="bg-gray-50 p-8 rounded-lg">
          <h3 className="text-xl font-medium mb-4">Recent Time Entries</h3>
          <div className="space-y-4">
            {entries.slice(0, 5).map(entry => (
              <div key={entry.id} className="p-4 bg-white rounded-lg border">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{entry.project}</span>
                  <span>{format(entry.date, "MMM dd, yyyy")}</span>
                </div>
                <p className="text-sm text-gray-600">{entry.description}</p>
                <div className="text-right text-sm font-medium mt-2">{entry.hours} hours</div>
              </div>
            ))}
            {entries.length === 0 && (
              <p className="text-gray-500">No recent entries</p>
            )}
          </div>
        </div>
      </TabsContent>
    </>
  );
};

export default TabContent;
