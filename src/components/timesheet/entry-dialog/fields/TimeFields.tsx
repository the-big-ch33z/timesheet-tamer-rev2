
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, AlertTriangle } from "lucide-react";
import { WorkSchedule } from "@/types";
import { format } from "date-fns";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TimeFieldsProps {
  startTime: string;
  endTime: string;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  selectedDate: Date;
  workSchedule?: WorkSchedule;
}

// Define a validation result type to avoid TypeScript errors
interface ValidationResult {
  valid: boolean;
  message?: string;
}

const TimeFields: React.FC<TimeFieldsProps> = ({ 
  startTime, 
  endTime, 
  setStartTime, 
  setEndTime,
  selectedDate,
  workSchedule
}) => {
  const [warning, setWarning] = useState<string | null>(null);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [pendingTime, setPendingTime] = useState<{type: 'start' | 'end', value: string} | null>(null);

  // Helper function to get weekday from date
  const getWeekDay = (date: Date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()] as any;
  };

  // Helper function to determine fortnight week (1 or 2)
  const getFortnightWeek = (date: Date): 1 | 2 => {
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const weeksSinceYearStart = Math.floor(
      (date.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return ((weeksSinceYearStart % 2) + 1) as 1 | 2;
  };

  // Check if the selected time is within the working hours
  const validateTime = (start: string, end: string): ValidationResult => {
    if (!workSchedule || !selectedDate) return { valid: true };

    const weekDay = getWeekDay(selectedDate);
    const weekNum = getFortnightWeek(selectedDate);
    
    // Check if it's an RDO
    if (workSchedule.rdoDays[weekNum].includes(weekDay)) {
      return {
        valid: false,
        message: "This is a rostered day off (RDO). Time entries are not expected."
      };
    }
    
    // Get scheduled work hours for this day
    const scheduledHours = workSchedule.weeks[weekNum][weekDay];
    
    // If no scheduled hours, it's not a working day
    if (!scheduledHours) {
      return {
        valid: false,
        message: "This is not a scheduled working day."
      };
    }
    
    // Check if time is within working hours
    const schedStart = scheduledHours.startTime;
    const schedEnd = scheduledHours.endTime;
    
    if (start < schedStart || end > schedEnd) {
      return {
        valid: false,
        message: `Time entries should be within scheduled working hours (${schedStart} - ${schedEnd}).`
      };
    }
    
    return { valid: true };
  };

  // Handle time changes with validation
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    const timeToValidate = type === 'start' ? value : startTime;
    const otherTime = type === 'start' ? endTime : value;
    
    const validation = validateTime(timeToValidate, otherTime);
    
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
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <div className="relative">
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => handleTimeChange('start', e.target.value)}
              required
              className="pr-10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Clock className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <div className="relative">
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => handleTimeChange('end', e.target.value)}
              required
              className="pr-10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Clock className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {warning && (
        <Alert variant="default" className="mt-2 bg-amber-50 border-amber-200 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}

      {/* Override Confirmation Dialog */}
      <AlertDialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Time Outside Working Hours</AlertDialogTitle>
            <AlertDialogDescription>
              {warning}
              <p className="mt-2">Do you want to override this warning and continue?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelOverride}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleOverride}>Yes, Override</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TimeFields;
