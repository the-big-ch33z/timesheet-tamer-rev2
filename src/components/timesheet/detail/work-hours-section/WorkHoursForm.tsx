
import React from 'react';
import { TimeInputField } from '../components/TimeInputField';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('WorkHoursForm');

export interface WorkHoursFormProps {
  startTime: string;
  endTime: string;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
  interactive: boolean;
  disabled?: boolean;
}

/**
 * WorkHoursForm Component
 * 
 * Provides time input fields for work hours (start and end times)
 */
const WorkHoursForm: React.FC<WorkHoursFormProps> = ({
  startTime,
  endTime,
  onTimeChange,
  interactive,
  disabled = false
}) => {
  logger.debug('Rendering WorkHoursForm', { startTime, endTime, interactive });
  
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <TimeInputField
        label="Start Time"
        value={startTime}
        onChange={onTimeChange}
        disabled={disabled}
        placeholder="e.g. 8:30am"
        aria-label="Start time"
        className="w-full"
        type="start"
        interactive={interactive}
        testId="start-time-input"
      />
      
      <TimeInputField
        label="End Time"
        value={endTime}
        onChange={onTimeChange}
        disabled={disabled}
        placeholder="e.g. 5:00pm"
        aria-label="End time"
        className="w-full"
        type="end"
        interactive={interactive}
        testId="end-time-input"
      />
    </div>
  );
};

export default WorkHoursForm;
