
import React from 'react';
import { useTimesheetData } from '@/hooks/timesheet/useTimesheetData';
import { useWorkHours } from '@/hooks/timesheet/useWorkHours'; // Using the unified hook
import WorkHoursInterface from './work-hours/WorkHoursInterface';
import TimeEntryController from '../entry-control/TimeEntryController'; // Import the TimeEntryController
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import DailySummaryPanel from './components/DailySummaryPanel';

const logger = createTimeLogger('WorkHoursSection');

interface WorkHoursSectionProps {
  date: Date;
  userId: string;
  interactive: boolean;
  workSchedule?: any;
}

/**
 * Work Hours Section Component
 * 
 * Displays the work hours input and summary for a specific date
 */
const WorkHoursSection: React.FC<WorkHoursSectionProps> = ({
  date,
  userId,
  interactive,
  workSchedule
}) => {
  logger.debug(`Rendering WorkHoursSection for ${format(date, 'yyyy-MM-dd')}`);

  // Use the unified timesheet data hook
  const { entries } = useTimesheetData({
    userId,
    date
  }); // Fix: Pass as one options object instead of separate arguments

  // Use the workHours hook to get calculatedHours and totalEnteredHours
  const { calculatedHours, totalEnteredHours } = useWorkHours({
    userId,
    date,
    entries,
    workSchedule
  });

  return (
    <div className="space-y-4">
      {/* Top section with work hours interface */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <WorkHoursInterface
          date={date}
          userId={userId}
          entries={entries}
          workSchedule={workSchedule}
          interactive={interactive}
        />
      </div>
      
      {/* Middle section with time entry controller and daily summary */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Time entries section (left) */}
        <div className="flex-grow md:w-2/3">
          <TimeEntryController
            date={date}
            userId={userId}
            interactive={interactive}
          />
        </div>
        
        {/* Daily Summary Panel (right) */}
        <div className="md:w-1/3">
          <DailySummaryPanel
            requiredHours={calculatedHours}
            submittedHours={totalEnteredHours}
            date={date}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkHoursSection;
