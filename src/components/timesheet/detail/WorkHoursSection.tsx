
import React from 'react';
import { useTimesheetData } from '@/hooks/timesheet/useTimesheetData';
import { useWorkHours } from '@/hooks/timesheet/useWorkHours'; // Using the unified hook
import WorkHoursInterface from './work-hours/WorkHoursInterface';
import TimeEntryController from '../entry-control/TimeEntryController'; // Import the TimeEntryController
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

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
  });

  return (
    <div className="space-y-6">
      {/* Work hours interface with integrated daily summary */}
      <div className="mb-4">
        <WorkHoursInterface
          date={date}
          userId={userId}
          entries={entries}
          workSchedule={workSchedule}
          interactive={interactive}
        />
      </div>
      
      {/* Time entries section (full width) */}
      <div>
        <TimeEntryController
          date={date}
          userId={userId}
          interactive={interactive}
        />
      </div>
    </div>
  );
};

export default WorkHoursSection;
