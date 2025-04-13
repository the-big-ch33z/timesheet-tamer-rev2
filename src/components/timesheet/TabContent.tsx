
import React, { useMemo, Suspense, lazy } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { useTabContent } from "./hooks/useTabContent";
import { 
  useCalendarContext,
  useUserTimesheetContext,
  useEntriesContext 
} from "@/contexts/timesheet";

// Lazy load components
const TimesheetCalendar = lazy(() => import("./TimesheetCalendar"));
const WorkHoursSection = lazy(() => import("./detail/WorkHoursSection"));
const MonthlyHours = lazy(() => import("./MonthlyHours"));
const ToilSummary = lazy(() => import("./ToilSummary"));
const RecentEntries = lazy(() => import("./RecentEntries"));

// Loading component
const LoadingComponent = () => (
  <div className="animate-pulse p-4 space-y-4">
    <div className="h-32 bg-gray-200 rounded"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
  </div>
);

const TabContent: React.FC = () => {
  const { currentMonth, selectedDay, prevMonth, nextMonth, handleDayClick } = useCalendarContext();
  const { viewedUser, workSchedule, canEditTimesheet } = useUserTimesheetContext();
  const { entries, createEntry, getDayEntries } = useEntriesContext();

  // Use memoized results from the hook to prevent unnecessary re-renders
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
  , [selectedDay, getDayEntries, entries]); // Add entries dependency to refresh when entries change

  // Generate unique key for WorkHoursSection to force proper re-render when day selection or entries change
  const workHoursSectionKey = useMemo(() => 
    selectedDay ? `work-hours-${selectedDay.toISOString()}-${dayEntries.length}-${Date.now()}` : 'no-day'
  , [selectedDay, dayEntries.length]);

  return (
    <>
      <TabsContent value="timesheet" className="mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Suspense fallback={<LoadingComponent />}>
              <TimesheetCalendar 
                currentMonth={currentMonth}
                entries={entries}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
                onDayClick={handleDayClick}
                workSchedule={workSchedule}
              />
            </Suspense>
            
            {selectedDay && (
              <div className="mt-6">
                <Suspense fallback={<LoadingComponent />}>
                  <WorkHoursSection 
                    entries={dayEntries}
                    date={selectedDay}
                    workSchedule={workSchedule}
                    interactive={canEditTimesheet}
                    onCreateEntry={handleCreateEntry}
                    key={workHoursSectionKey}
                  />
                </Suspense>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Suspense fallback={<LoadingComponent />}>
              <MonthlyHours 
                entries={entries} 
                user={viewedUser} 
                currentMonth={currentMonth} 
                workSchedule={workSchedule}
              />
            </Suspense>
            
            <Suspense fallback={<LoadingComponent />}>
              <ToilSummary entries={entries} />
            </Suspense>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="recent">
        <div className="bg-gray-50 p-8 rounded-lg">
          <h3 className="text-xl font-medium mb-4">Recent Time Entries</h3>
          <Suspense fallback={<LoadingComponent />}>
            <RecentEntries entries={sortedEntries} />
          </Suspense>
        </div>
      </TabsContent>
    </>
  );
};

// Export a memoized version of the component to prevent unnecessary re-renders
export default React.memo(TabContent);
