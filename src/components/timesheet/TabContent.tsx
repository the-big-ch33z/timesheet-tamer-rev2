
import React, { Suspense, lazy, useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { 
  useCalendarContext,
  useUserTimesheetContext
} from "@/contexts/timesheet";
import { useLogger } from "@/hooks/useLogger";

// Lazy load components
const TimesheetCalendar = lazy(() => import("./TimesheetCalendar"));
const WorkHoursSection = lazy(() => import("./detail/WorkHoursSection"));
const MonthlyHours = lazy(() => import("./MonthlyHours"));
const RecentEntries = lazy(() => import("./RecentEntries"));

const LoadingComponent = () => (
  <div className="animate-pulse p-4 space-y-4">
    <div className="h-32 bg-gray-200 rounded"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
  </div>
);

const TabContent: React.FC = () => {
  const { currentMonth, selectedDay, prevMonth, nextMonth, handleDayClick } = useCalendarContext();
  const { viewedUser, workSchedule, canEditTimesheet } = useUserTimesheetContext();
  const logger = useLogger('TabContent');
  
  useEffect(() => {
    if (selectedDay) {
      logger.debug(`Selected day updated: ${selectedDay.toISOString()}`);
    }
  }, [selectedDay, logger]);

  if (!viewedUser?.id) {
    return <div>No user selected</div>;
  }

  return (
    <>
      <TabsContent value="timesheet" className="mt-4">
        <div className="flex flex-col xl:flex-row gap-8 w-full px-0">
          {/* Work hours + calendar */}
          <div className="flex-1 w-full min-w-0 xl:pr-6">
            <Suspense fallback={<LoadingComponent />}>
              <TimesheetCalendar 
                currentMonth={currentMonth}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
                onDayClick={handleDayClick}
                workSchedule={workSchedule}
                userId={viewedUser.id}
              />
            </Suspense>
            
            {selectedDay && (
              <div className="mt-6 w-full">
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
          {/* Dashboards: Monthly/TOIL */}
          <div className="w-full xl:w-[440px] max-w-full flex-shrink-0">
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
    </>
  );
};

export default React.memo(TabContent);
