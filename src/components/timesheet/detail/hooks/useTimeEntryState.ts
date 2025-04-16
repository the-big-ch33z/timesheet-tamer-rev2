
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useWorkHours } from "./useWorkHours";
import { useTimeEntryForm } from "@/hooks/timesheet/useTimeEntryForm";
import { useEntryForms } from "./useEntryForms";
import { format } from "date-fns";
import { useTimeEntryStats } from "./useTimeEntryStats";
import { useTimeEntryFormHandling } from "./useTimeEntryFormHandling";
import { v4 as uuidv4 } from 'uuid';
import { useTimeCompletion } from "@/hooks/timesheet/useTimeCompletion";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { calculateHoursFromTimes } from "@/utils/time/calculations";

interface UseTimeEntryStateProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
  userId?: string;
}

// Maximum number of form handlers to pre-initialize
const MAX_FORM_HANDLERS = 5;

/**
 * Main hook for time entry state management
 * Composes several smaller, focused hooks
 */
export const useTimeEntryState = ({
  entries,
  date,
  workSchedule,
  interactive,
  onCreateEntry,
  userId = ''
}: UseTimeEntryStateProps) => {
  // Use the unified timesheet work hours hook
  const { getWorkHoursForDate, saveWorkHoursForDate } = useTimesheetWorkHours(userId);
  
  // Ref to track date changes
  const previousDateRef = useRef<string | null>(null);
  const currentDateString = date ? format(date, 'yyyy-MM-dd') : '';
  
  // Track when interactive flag changes
  useEffect(() => {
    console.debug(`[useTimeEntryState] Interactive flag changed to: ${interactive}`);
  }, [interactive]);
  
  // State for times
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [calculatedHours, setCalculatedHours] = useState(0);
  
  // Load work hours when date or entries change
  useEffect(() => {
    if (!date || !userId) return;
    
    console.debug(`[useTimeEntryState] Loading work hours for ${format(date, 'yyyy-MM-dd')}`);
    const { startTime: storedStart, endTime: storedEnd } = getWorkHoursForDate(date, userId);
    
    setStartTime(storedStart);
    setEndTime(storedEnd);
    
    if (storedStart && storedEnd) {
      try {
        const hours = calculateHoursFromTimes(storedStart, storedEnd);
        setCalculatedHours(hours);
      } catch (error) {
        console.error("[useTimeEntryState] Error calculating hours:", error);
        setCalculatedHours(0);
      }
    }
  }, [date, userId, getWorkHoursForDate, entries.length]);
  
  // Helper function to create a mock entry with ID for type compatibility
  const createMockEntry = useCallback((entry: Omit<TimeEntry, "id">): TimeEntry => {
    return {
      ...entry,
      id: `temp-${uuidv4()}` // Create a temporary ID
    };
  }, []);
  
  // Pre-initialize a fixed number of form handlers upfront
  // This avoids calling hooks dynamically or conditionally
  const formHandler1 = useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => handleEntrySubmission(createMockEntry(entry), 0),
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  });
  
  const formHandler2 = useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => handleEntrySubmission(createMockEntry(entry), 1),
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  });
  
  const formHandler3 = useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => handleEntrySubmission(createMockEntry(entry), 2),
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  });
  
  const formHandler4 = useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => handleEntrySubmission(createMockEntry(entry), 3),
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  });
  
  const formHandler5 = useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => handleEntrySubmission(createMockEntry(entry), 4),
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  });
  
  // Combine all handlers in an array for easier access
  const formHandlers = useMemo(() => [
    formHandler1,
    formHandler2,
    formHandler3,
    formHandler4,
    formHandler5
  ], [formHandler1, formHandler2, formHandler3, formHandler4, formHandler5]);

  // Handle time input changes
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    console.debug(`[useTimeEntryState] Time change: ${type} = ${value}`);
    
    if (!interactive || !userId || !date) return;
    
    // Update local state
    if (type === 'start') {
      setStartTime(value);
    } else {
      setEndTime(value);
    }
    
    // Prepare new values
    const newStartTime = type === 'start' ? value : startTime;
    const newEndTime = type === 'end' ? value : endTime;
    
    // Save to context
    saveWorkHoursForDate(date, newStartTime, newEndTime, userId);
    
    // Update calculated hours
    if (newStartTime && newEndTime) {
      try {
        const hours = calculateHoursFromTimes(newStartTime, newEndTime);
        setCalculatedHours(hours);
        
        // Update form handlers with new times
        formHandlers.forEach(handler => {
          if (handler) {
            handler.updateTimes(newStartTime, newEndTime);
            handler.setHoursFromTimes();
          }
        });
      } catch (error) {
        console.error("[useTimeEntryState] Error calculating hours:", error);
      }
    } else {
      setCalculatedHours(0);
    }
  }, [startTime, endTime, interactive, date, userId, saveWorkHoursForDate, formHandlers]);

  // Track date changes to detect when user changes dates
  useEffect(() => {
    // Check if the date has changed
    if (previousDateRef.current && previousDateRef.current !== currentDateString) {
      console.debug(`[useTimeEntryState] Date changed from ${previousDateRef.current} to ${currentDateString}`);
    }
    
    // Update the ref for next comparison
    previousDateRef.current = currentDateString;
  }, [currentDateString]);

  // Handle form state (showing/hiding, adding/removing forms)
  const {
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    refreshForms,
    key
  } = useEntryForms({ 
    formHandlers,
    maxForms: MAX_FORM_HANDLERS
  });

  // Calculate stats like total hours and variance
  const {
    totalHours,
    hoursVariance,
    hasEntries,
    isUndertime
  } = useTimeEntryStats({
    entries,
    calculatedHours
  });

  const {
    targetHours,
    totalHours: totalEntryHours,
    isComplete,
    hoursRemaining
  } = useTimeCompletion(entries, startTime, endTime);

  // Handle form submissions and entry creation
  const {
    handleEntrySubmission,
    handleSaveEntry,
    saveAllPendingChanges
  } = useTimeEntryFormHandling({
    formHandlers,
    showEntryForms,
    interactive,
    onCreateEntry,
    startTime,
    endTime,
    calculatedHours,
    refreshForms
  });

  // When entries change, refresh our state
  useEffect(() => {
    console.debug(`[useTimeEntryState] Entries changed: ${entries.length} entries`);
  }, [entries]);

  return {
    startTime,
    endTime,
    calculatedHours: targetHours,
    totalHours: totalHours,
    hasEntries,
    hoursVariance,
    
    formHandlers,
    showEntryForms,
    key,

    handleTimeChange,
    handleSaveEntry,
    addEntryForm,
    removeEntryForm,
    saveAllPendingChanges,
    
    interactive,
    isUndertime,
    isComplete,
    hoursRemaining
  };
};
