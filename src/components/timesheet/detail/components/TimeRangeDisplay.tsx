
import React, { useState } from 'react';
import { Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TimeInput from '../../entry-dialog/fields/time/TimeInput';

interface TimeRangeDisplayProps {
  startTime: string;
  endTime: string;
  calculatedHours: number;
  updateWorkHours: (start: string, end: string) => void;
  interactive: boolean;
}

const TimeRangeDisplay: React.FC<TimeRangeDisplayProps> = ({
  startTime,
  endTime,
  calculatedHours,
  updateWorkHours,
  interactive
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editStartTime, setEditStartTime] = useState(startTime);
  const [editEndTime, setEditEndTime] = useState(endTime);
  
  const handleSave = () => {
    updateWorkHours(editStartTime, editEndTime);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditStartTime(startTime);
    setEditEndTime(endTime);
    setIsEditing(false);
  };

  if (!interactive) {
    return (
      <div className="flex items-center text-sm">
        <Clock className="h-4 w-4 mr-2 text-gray-500" />
        <span>
          {startTime} - {endTime} ({calculatedHours.toFixed(1)} hrs)
        </span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex flex-col sm:flex-row items-end gap-2">
        <div className="flex gap-2">
          <TimeInput
            id="edit-start-time"
            label="Start"
            value={editStartTime}
            onChange={setEditStartTime}
          />
          <TimeInput
            id="edit-end-time"
            label="End"
            value={editEndTime}
            onChange={setEditEndTime}
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center text-sm">
        <Clock className="h-4 w-4 mr-2 text-gray-500" />
        <span>
          {startTime} - {endTime} ({calculatedHours.toFixed(1)} hrs)
        </span>
      </div>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => setIsEditing(true)}
      >
        Edit
      </Button>
    </div>
  );
};

export default TimeRangeDisplay;
