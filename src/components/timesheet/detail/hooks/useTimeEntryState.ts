
import { useCallback, useEffect, useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useWorkHours } from "./useWorkHours";
import { useTimeEntryForm } from "@/hooks/timesheet/useTimeEntryForm";
import { useEntryForms } from "./useEntryForms";
import { format } from "date-fns";
import { useTimeEntryStats } from "./useTimeEntryStats";
import { useTimeEntryFormHandling } from "./useTimeEntryFormHandling";
import { useTimeEntryInitialValues } from "./useTimeEntryInitialValues";
import { v4 as uuidv4 } from 'uuid';

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
  // Track when interactive flag changes
  useEffect(() => {
    console.debug(`[useTimeEntryState] Interactive flag changed to: ${interactive}`);
  }, [interactive]);
  
  // Get initial time values from entries or schedule
  const { initialStartTime, initialEndTime } = useTimeEntryInitialValues({
    entries,
    date,
    workSchedule
  });
  
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

  // Handle time calculations and time input changes
  const {
    startTime,
    endTime,
    calculatedHours,
    handleTimeChange
  } = useWorkHours({
    initialStartTime,
    initialEndTime,
    formHandlers,
    interactive,
    date,
    userId
  });

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

  // Log entries for debugging
  useEffect(() => {
    console.log("Entries updated in TimeEntryState:", entries.length);
    if (entries.length > 0) {
      entries.forEach(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        console.log("Entry date:", format(entryDate, "yyyy-MM-dd"), "Entry id:", entry.id);
      });
    }
  }, [entries]);

  return {
    startTime,
    endTime,
    calculatedHours,
    totalHours,
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
    isUndertime
  };
};
