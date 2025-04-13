
import React, { useMemo } from "react";
import { TabsContent } from "@/components/ui/tabs";
import TimesheetCalendar from "./TimesheetCalendar";
import ToilSummary from "./ToilSummary";
import MonthlyHours from "./MonthlyHours";
import RecentEntries from "./RecentEntries";
import WorkHoursSection from "./detail/WorkHoursSection";
import { useTabContent } from "./hooks/useTabContent";
import { 
  useCalendarContext,
  useUserTimesheetContext,
  useEntriesContext 
} from "@/contexts/timesheet";

const TabContent: React.FC = () => {
  const { currentMonth, selectedDay, prevMonth, nextMonth, handleDayClick } = useCalendarContext();
  const { viewedUser, workSchedule, canEditTimesheet } = useUserTimesheetContext();
  const { entries, createEntry, getDayEntries } = useEntriesContext();

  const { sortedEntries } = useTabContent({ 
    entries, 
    currentMonth, 
    workSchedule, 
    user: viewedUser
  });

  // Create a function to create a basic entry from time inputs
  const handleCreateEntry = (startTime: string, endTime: string, hours: number) => {
    if (selectedDay && viewedUser) {
      createEntry({
        date: selectedDay,
        hours: hours,
        startTime: startTime,
        endTime: endTime,
        userId: viewedUser.id,
      });
    }
  };

  // Get entries for the selected day - memoized to prevent recalculation on each render
  const dayEntries = useMemo(() => 
    selectedDay ? getDayEntries(selectedDay) : []
  , [selectedDay, getDayEntries]);

  return (
    <>
      <TabsContent value="timesheet" className="mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TimesheetCalendar 
              currentMonth={currentMonth}
              entries={entries}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onDayClick={handleDayClick}
              workSchedule={workSchedule}
            />
            
            {selectedDay && (
              <div className="mt-6">
                <WorkHoursSection 
                  entries={dayEntries}
                  date={selectedDay}
                  workSchedule={workSchedule}
                  interactive={canEditTimesheet}
                  onCreateEntry={handleCreateEntry}
                />
              </div>
            )}
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
