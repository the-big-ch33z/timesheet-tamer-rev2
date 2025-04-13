
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
  
  // Force component re-render when entries change
  const [refreshKey, setRefreshKey] = useState(Date.now());

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
      console.log("Creating new entry:", { startTime, endTime, hours, date: selectedDay, userId: viewedUser.id });
      
      createEntry({
        date: selectedDay,
        hours: hours,
        startTime: startTime,
        endTime: endTime,
        userId: viewedUser.id,
        description: '',  // Add empty description to ensure the object has all fields
        jobNumber: '',
        rego: '',
        taskNumber: '',
        project: 'General',
      });
      
      // Force a refresh of the component after an entry is created
      setTimeout(() => {
        console.log("Forcing refresh after entry creation");
        setRefreshKey(Date.now());
      }, 100);
    }
  };

  // Get entries for the selected day - memoized to prevent recalculation on each render
  const dayEntries = useMemo(() => {
    if (!selectedDay) return [];
    
    const dayEntriesList = getDayEntries(selectedDay);
    console.log("TabContent: Got day entries for", format(selectedDay, "yyyy-MM-dd"), 
      "count:", dayEntriesList.length);
    
    if (dayEntriesList.length > 0) {
      dayEntriesList.forEach(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        console.log("TabContent day entry date:", format(entryDate, "yyyy-MM-dd"), "Entry id:", entry.id);
      });
    }
    
    return dayEntriesList;
  }, [selectedDay, getDayEntries, entries, refreshKey]);

  // Log when selected day changes
  useEffect(() => {
    if (selectedDay) {
      console.log("Selected day changed to:", format(selectedDay, "yyyy-MM-dd"));
    }
  }, [selectedDay]);

  // Generate unique key for WorkHoursSection to force proper re-render when day selection or entries change
  const workHoursSectionKey = useMemo(() => 
    selectedDay ? `work-hours-${selectedDay.toISOString()}-${dayEntries.length}-${refreshKey}` : 'no-day'
  , [selectedDay, dayEntries.length, refreshKey]);

  // When entries change, update the refresh key to force re-render
  useEffect(() => {
    setRefreshKey(Date.now());
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
