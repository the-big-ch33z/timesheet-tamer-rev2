
import React from 'react';
import { useTimesheetData } from '@/hooks/timesheet/useTimesheetData';
import { useWorkHours } from '@/hooks/timesheet/useWorkHours'; // Using the unified hook
import WorkHoursInterface from './work-hours/WorkHoursInterface';
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
  }); // Fix: Pass as one options object instead of separate arguments

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <WorkHoursInterface
        date={date}
        userId={userId}
        entries={entries}
        workSchedule={workSchedule}
        interactive={interactive}
      />
    </div>
  );
};

export default WorkHoursSection;
