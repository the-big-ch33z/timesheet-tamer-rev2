
import React from "react";
import WorkHoursHeader from "../components/WorkHoursHeader";
import WorkHoursDisplay from "../components/WorkHoursDisplay";
import WorkHoursAlerts from "../components/WorkHoursAlerts";
import WorkHoursActionButtons from "../components/WorkHoursActionButtons";
import { WorkHoursStatus } from "../components/WorkHoursStatus";
import { TimeEntry, WorkSchedule } from '@/types';
import { BreakConfig } from '../work-hours/types';

interface WorkHoursContentProps {
  date: Date;
  userId: string;
  dayEntries: TimeEntry[];
  workSchedule?: WorkSchedule;
  interactive: boolean;
  startTime: string;
  endTime: string;
  effectiveTotalHours: number;
  calculatedTimeHours: number;
  hasEntries: boolean;
  isActuallyComplete: boolean;
  hoursVariance: number;
  isUndertime: boolean;
  breakConfig: BreakConfig;
  displayBreakConfig: BreakConfig;
  actionStates: Record<string, boolean>;
  isOverScheduled: boolean;
  isCalculating: boolean;
  handleTimeChange: (type: 'start' | 'end', value: string) => void;
  handleToggleAction: (type: string, scheduledHours: number) => void;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const WorkHoursContent: React.FC<WorkHoursContentProps> = ({
  date,
  userId,
  dayEntries,
  workSchedule,
  interactive,
  startTime,
  endTime,
  effectiveTotalHours,
  calculatedTimeHours,
  hasEntries,
  isActuallyComplete,
  hoursVariance,
  isUndertime,
  breakConfig,
  displayBreakConfig,
  actionStates,
  isOverScheduled,
  isCalculating,
  handleTimeChange,
  handleToggleAction,
  onCreateEntry
}) => {
  const leaveActive = actionStates.leave || actionStates.sick;
  const toilActive = actionStates.toil;
  
  const highlightBg = actionStates.sick
    ? "bg-[#fff6f6]"
    : actionStates.leave
      ? "bg-[#f5faff]"
      : actionStates.toil
        ? "bg-purple-50"
        : "bg-white";

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <WorkHoursHeader hasEntries={hasEntries || leaveActive} />
        <WorkHoursActionButtons 
          value={actionStates} 
          onToggle={(type) => handleToggleAction(type, calculatedTimeHours)} 
        />
      </div>
      <div className="flex space-x-4 items-start">
        <div className="flex-1">
          <div className={`rounded-lg border border-gray-200 ${
            actionStates.sick ? "bg-[#fff6f6]" :
            actionStates.leave ? "bg-[#f5faff]" :
            actionStates.toil ? "bg-purple-50" : "bg-white"
          }`}>
            <WorkHoursDisplay
              startTime={startTime}
              endTime={endTime}
              totalHours={effectiveTotalHours}
              calculatedHours={calculatedTimeHours}
              hasEntries={hasEntries}
              interactive={interactive && !leaveActive && !toilActive}
              onTimeChange={handleTimeChange}
              isComplete={isActuallyComplete}
              hoursVariance={hoursVariance}
              isUndertime={isUndertime}
              breaksIncluded={displayBreakConfig}
              overrideStates={{
                lunch: actionStates.lunch,
              }}
            />
          </div>
          <WorkHoursAlerts
            hasEntries={hasEntries}
            isUndertime={isUndertime}
            hoursVariance={hoursVariance}
            interactive={interactive}
            date={date}
            isComplete={isActuallyComplete}
          />
          {isCalculating && (
            <div className="mt-2 text-xs text-blue-500 text-center animate-pulse flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating time accruals...
            </div>
          )}
        </div>
        <WorkHoursStatus
          effectiveTotalHours={effectiveTotalHours}
          scheduledHours={calculatedTimeHours}
          isOverScheduled={isOverScheduled}
          isActuallyComplete={isActuallyComplete}
          isUndertime={isUndertime}
          isDaySick={actionStates.sick}
          isDayLeave={actionStates.leave}
          isDayToil={actionStates.toil}
        />
      </div>
    </>
  );
};

export default WorkHoursContent;
