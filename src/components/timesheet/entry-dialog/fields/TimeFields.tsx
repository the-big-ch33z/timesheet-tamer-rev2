
import React, { useState } from "react";
import { WorkSchedule } from "@/types";
import TimeInput from "./time/TimeInput";
import TimeWarningDialog from "./time/TimeWarningDialog";
import TimeWarningAlert from "./time/TimeWarningAlert";
import { validateTime } from "@/utils/time/validation/timeValidation";

interface TimeFieldsProps {
  startTime: string;
  endTime: string;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  selectedDate: Date;
  workSchedule?: WorkSchedule;
  disabled?: boolean;
}

const TimeFields: React.FC<TimeFieldsProps> = ({ 
  startTime, 
  endTime, 
  setStartTime, 
  setEndTime,
  selectedDate,
  workSchedule,
  disabled = false
}) => {
  const [warning, setWarning] = useState<string | null>(null);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [pendingTime, setPendingTime] = useState<{type: 'start' | 'end', value: string} | null>(null);

  // Handle time changes with validation
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (disabled) return;
    
    const timeToValidate = type === 'start' ? value : startTime;
    const otherTime = type === 'start' ? endTime : value;
    
    const validation = validateTime(timeToValidate, otherTime, selectedDate, workSchedule);
    
    if (!validation.valid) {
      setWarning(validation.message);
      setPendingTime({ type, value });
      setShowOverrideDialog(true);
    } else {
      setWarning(null);
      if (type === 'start') {
        setStartTime(value);
      } else {
        setEndTime(value);
      }
    }
  };

  // Handle override confirmation
  const handleOverride = () => {
    if (pendingTime) {
      if (pendingTime.type === 'start') {
        setStartTime(pendingTime.value);
      } else {
        setEndTime(pendingTime.value);
      }
    }
    setShowOverrideDialog(false);
    setPendingTime(null);
  };

  // Cancel override
  const handleCancelOverride = () => {
    setShowOverrideDialog(false);
    setPendingTime(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <TimeInput 
          id="startTime"
          label="Start Time"
          value={startTime}
          onChange={(value) => handleTimeChange('start', value)}
          disabled={disabled}
        />
        
        <TimeInput 
          id="endTime"
          label="End Time"
          value={endTime}
          onChange={(value) => handleTimeChange('end', value)}
          disabled={disabled}
        />
      </div>

      <TimeWarningAlert message={warning} />

      <TimeWarningDialog
        open={showOverrideDialog}
        onOpenChange={setShowOverrideDialog}
        warningMessage={warning}
        onOverride={handleOverride}
        onCancel={handleCancelOverride}
      />
    </>
  );
};

export default TimeFields;
