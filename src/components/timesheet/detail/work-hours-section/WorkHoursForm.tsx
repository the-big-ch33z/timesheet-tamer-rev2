
import React from 'react';
import { TimeInputField } from '../components/TimeInputField';

interface WorkHoursFormProps {
  startTime: string;
  endTime: string;
  interactive: boolean;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
}

const WorkHoursForm: React.FC<WorkHoursFormProps> = ({
  startTime,
  endTime,
  interactive,
  onTimeChange
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 my-3">
      <div>
        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
          Start Time
        </label>
        <TimeInputField
          id="startTime"
          value={startTime}
          onChange={(value) => onTimeChange('start', value)}
          disabled={!interactive}
          placeholder="09:00"
          aria-label="Start time"
          className="w-full"
          label="Start Time"
          type="start"
          interactive={interactive}
          testId="start-time-input"
        />
      </div>
      <div>
        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
          End Time
        </label>
        <TimeInputField
          id="endTime"
          value={endTime}
          onChange={(value) => onTimeChange('end', value)}
          disabled={!interactive}
          placeholder="17:00" 
          aria-label="End time"
          className="w-full"
          label="End Time"
          type="end"
          interactive={interactive}
          testId="end-time-input"
        />
      </div>
    </div>
  );
};

export default WorkHoursForm;
