
import React, { useState, useCallback } from "react";
import { WorkSchedule } from "@/types";
import TimeInput from "@/components/ui/time-input/TimeInput";
import TimeWarningDialog from "./time/TimeWarningDialog";
import TimeWarningAlert from "./time/TimeWarningAlert";
import { validateTime, validateTimeOrder } from "@/utils/time/validation/timeValidation";

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
  // Track if we're in the middle of editing
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Handle time changes with validation
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    if (disabled) return;
    
    // Allow empty values during editing
    if (!value) {
      setIsEditing(true);
      return;
    }
    
    const timeToValidate = type === 'start' ? value : startTime;
    const otherTime = type === 'start' ? endTime : value;
    
    // First do a basic validation of time order
    const orderValidation = validateTimeOrder(
      type === 'start' ? value : startTime,
      type === 'end' ? value : endTime
    );
    
    if (!orderValidation.valid && !isEditing) {
      setWarning(orderValidation.message);
      setPendingTime({ type, value });
      setShowOverrideDialog(true);
      return;
    }
    
    // Then do full validation against schedule
    const validation = validateTime(timeToValidate, otherTime, selectedDate, workSchedule);
    
    if (!validation.valid && !isEditing) {
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
      setIsEditing(false);
    }
  }, [startTime, endTime, selectedDate, workSchedule, disabled, isEditing, setStartTime, setEndTime]);

  // Handle blur event to finalize editing
  const handleInputBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Handle override confirmation
  const handleOverride = useCallback(() => {
    if (pendingTime) {
      if (pendingTime.type === 'start') {
        setStartTime(pendingTime.value);
      } else {
        setEndTime(pendingTime.value);
      }
    }
    setShowOverrideDialog(false);
    setPendingTime(null);
    setIsEditing(false);
  }, [pendingTime, setStartTime, setEndTime]);

  // Cancel override
  const handleCancelOverride = useCallback(() => {
    setShowOverrideDialog(false);
    setPendingTime(null);
    setIsEditing(false);
  }, []);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <TimeInput 
          id="startTime"
          label="Start Time"
          value={startTime}
          onChange={(value) => handleTimeChange('start', value)}
          onBlur={handleInputBlur}
          disabled={disabled}
        />
        
        <TimeInput 
          id="endTime"
          label="End Time"
          value={endTime}
          onChange={(value) => handleTimeChange('end', value)}
          onBlur={handleInputBlur}
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
