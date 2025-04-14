
import React, { useMemo, Suspense, lazy, useEffect, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { useTabContent } from "./hooks/useTabContent";
import { 
  useCalendarContext,
  useUserTimesheetContext,
  useEntriesContext 
} from "@/contexts/timesheet";
import { format } from "date-fns";

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
  
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  const { sortedEntries } = useTabContent({ 
    entries, 
    currentMonth, 
    workSchedule, 
    user: viewedUser
  });

  // Create a debounced refresh function to avoid too many refreshes
  const triggerRefresh = () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    // Schedule a refresh after a short delay to allow state to settle
    const timeout = setTimeout(() => {
      console.log("Refreshing components after entry changes");
      setRefreshKey(Date.now());
    }, 300);
    
    setRefreshTimeout(timeout);
  };

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [refreshTimeout]);

  const handleCreateEntry = (startTime: string, endTime: string, hours: number) => {
    if (selectedDay && viewedUser) {
      console.log("Creating new entry:", { startTime, endTime, hours, date: selectedDay, userId: viewedUser.id });
      
      createEntry({
        date: selectedDay,
        hours: hours,
        startTime: startTime,
        endTime: endTime,
        userId: viewedUser.id,
        description: '',
        jobNumber: '',
        rego: '',
        taskNumber: '',
        project: 'General',
      });
      
      // Trigger refresh shortly after creating entry
      triggerRefresh();
    }
  };

  // Get entries for the selected day with proper memoization
  const dayEntries = useMemo(() => {
    if (!selectedDay) return [];
    
    const dayEntriesList = getDayEntries(selectedDay);
    console.log("TabContent: Got day entries for", format(selectedDay, "yyyy-MM-dd"), 
      "count:", dayEntriesList.length);
    
    return dayEntriesList;
  }, [selectedDay, getDayEntries, entries.length, refreshKey]);

  // Create a key for the WorkHoursSection to force re-render when needed
  const workHoursSectionKey = useMemo(() => 
    selectedDay ? `work-hours-${selectedDay.toISOString()}-${dayEntries.length}-${refreshKey}` : 'no-day'
  , [selectedDay, dayEntries.length, refreshKey]);

  // Monitor changes to entries length to trigger refresh
  useEffect(() => {
    triggerRefresh();
  }, [entries.length]);

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
                key={`monthly-hours-${refreshKey}`}
              />
            </Suspense>
            
            <Suspense fallback={<LoadingComponent />}>
              <ToilSummary 
                entries={entries} 
                key={`toil-${refreshKey}`}
              />
            </Suspense>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="recent">
        <div className="bg-gray-50 p-8 rounded-lg">
          <h3 className="text-xl font-medium mb-4">Recent Time Entries</h3>
          <Suspense fallback={<LoadingComponent />}>
            <RecentEntries 
              entries={sortedEntries}
              key={`recent-${refreshKey}`}
            />
          </Suspense>
        </div>
      </TabsContent>
    </>
  );
};

export default React.memo(TabContent);
