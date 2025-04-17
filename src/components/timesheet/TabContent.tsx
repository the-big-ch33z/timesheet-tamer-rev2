
import React, { useMemo, Suspense, lazy } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { 
  useCalendarContext,
  useUserTimesheetContext
} from "@/contexts/timesheet";
import { TimeEntryProvider } from "@/contexts/timesheet/entries-context/TimeEntryProvider";

// Lazy load components
const TimesheetCalendar = lazy(() => import("./TimesheetCalendar"));
const WorkHoursSection = lazy(() => import("./detail/WorkHoursSection"));
const MonthlyHours = lazy(() => import("./MonthlyHours"));
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
  
  // Ensure we have a user ID before rendering
  if (!viewedUser?.id) {
    return <div>No user selected</div>;
  }

  return (
    <>
      {/* Wrap both tabs with the TimeEntryProvider */}
      <TimeEntryProvider selectedDate={selectedDay} userId={viewedUser.id}>
        <TabsContent value="timesheet" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Suspense fallback={<LoadingComponent />}>
                <TimesheetCalendar 
                  currentMonth={currentMonth}
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
                      date={selectedDay}
                      userId={viewedUser.id}
                      interactive={canEditTimesheet}
                      workSchedule={workSchedule}
                      key={`work-hours-${selectedDay.toISOString()}`}
                    />
                  </Suspense>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <Suspense fallback={<LoadingComponent />}>
                <MonthlyHours 
                  user={viewedUser} 
                  currentMonth={currentMonth} 
                  workSchedule={workSchedule}
                />
              </Suspense>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="bg-gray-50 p-8 rounded-lg">
            <h3 className="text-xl font-medium mb-4">Recent Time Entries</h3>
            <Suspense fallback={<LoadingComponent />}>
              <RecentEntries />
            </Suspense>
          </div>
        </TabsContent>
      </TimeEntryProvider>
    </>
  );
};

export default React.memo(TabContent);
