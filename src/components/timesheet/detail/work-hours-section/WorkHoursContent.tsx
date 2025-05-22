
import React from 'react';
import { format } from 'date-fns';
import WorkHoursForm from './WorkHoursForm';
import { createTimeLogger } from '@/utils/time/errors';
import WorkHoursAlerts from '../components/WorkHoursAlerts';

const logger = createTimeLogger('WorkHoursContent');

export interface WorkHoursContentProps {
  date: Date;
  startTime: string;
  endTime: string;
  effectiveTotalHours: number;
  calculatedTimeHours: number;
  hasEntries: boolean;
  interactive: boolean;
  isActuallyComplete: boolean;
  hoursVariance: number;
  isUndertime: boolean;
  breakConfig: {
    lunch: boolean;
    smoko: boolean;
  };
  displayBreakConfig: {
    lunch: boolean;
    smoko: boolean;
  };
  actionStates: {
    lunch: boolean;
    smoko: boolean;
  };
  isOverScheduled: boolean;
  isCalculating: boolean;
  handleTimeChange: (type: 'start' | 'end', value: string) => void;
  handleToggleAction: (action: string) => void;
}

/**
 * Work Hours Content Component
 * 
 * Displays work hours form and status/alerts for a specific day
 */
const WorkHoursContent: React.FC<WorkHoursContentProps> = ({
  date,
  startTime,
  endTime,
  effectiveTotalHours,
  calculatedTimeHours,
  hasEntries,
  interactive,
  isActuallyComplete,
  hoursVariance,
  isUndertime,
  breakConfig,
  displayBreakConfig,
  actionStates,
  isOverScheduled,
  isCalculating,
  handleTimeChange,
  handleToggleAction
}) => {
  logger.debug('Rendering WorkHoursContent', { 
    date: format(date, 'yyyy-MM-dd'),
    startTime, 
    endTime, 
    effectiveTotalHours 
  });

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium mb-2">
        Work Hours for {format(date, 'EEE dd MMM yyyy')}
      </div>

      {/* Time Input Form */}
      <WorkHoursForm
        startTime={startTime}
        endTime={endTime}
        onTimeChange={handleTimeChange}
        interactive={interactive}
        disabled={isCalculating}
      />

      {/* Status and Alerts */}
      <WorkHoursAlerts
        hasEntries={hasEntries}
        isComplete={isActuallyComplete}
        hoursVariance={hoursVariance}
        isUndertime={isUndertime}
        isOverScheduled={isOverScheduled}
        effectiveHours={effectiveTotalHours}
        scheduledHours={calculatedTimeHours}
        breakConfig={breakConfig}
        displayBreakConfig={displayBreakConfig}
        actionStates={actionStates}
        onToggleAction={handleToggleAction}
      />
    </div>
  );
};

export default WorkHoursContent;
