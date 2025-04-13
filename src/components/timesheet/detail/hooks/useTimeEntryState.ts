
import { useCallback, useEffect, useMemo, useState } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useWorkHours } from "./useWorkHours";
import { useTimeEntryForm } from "@/hooks/timesheet/useTimeEntryForm";
import { calculateHoursVariance, isUndertime } from "@/utils/time/calculations";
import { useEntryForms } from "./useEntryForms";
import { format } from "date-fns";
import { getDayScheduleInfo } from "@/utils/time/scheduleUtils";

interface UseTimeEntryStateProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

// Maximum number of form handlers to pre-initialize
const MAX_FORM_HANDLERS = 5;

export const useTimeEntryState = ({
  entries,
  date,
  workSchedule,
  interactive,
  onCreateEntry
}: UseTimeEntryStateProps) => {
  // Get initial time values from entries or schedule
  let initialStartTime = "09:00";
  let initialEndTime = "17:00";

  if (entries.length > 0) {
    initialStartTime = entries[0].startTime || initialStartTime;
    initialEndTime = entries[0].endTime || initialEndTime;
  } else if (workSchedule) {
    const scheduleInfo = getDayScheduleInfo(date, workSchedule);
    
    if (scheduleInfo?.hours) {
      initialStartTime = scheduleInfo.hours.startTime || initialStartTime;
      initialEndTime = scheduleInfo.hours.endTime || initialEndTime;
    }
  }
  
  // Pre-initialize a fixed number of form handlers upfront
  // This avoids calling hooks dynamically or conditionally
  const formHandler1 = useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => handleEntrySubmission(entry, 0),
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  });
  
  const formHandler2 = useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => handleEntrySubmission(entry, 1),
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  });
  
  const formHandler3 = useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => handleEntrySubmission(entry, 2),
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  });
  
  const formHandler4 = useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => handleEntrySubmission(entry, 3),
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  });
  
  const formHandler5 = useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => handleEntrySubmission(entry, 4),
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
  
  // Function to handle form submission
  const handleEntrySubmission = useCallback((entry: any, index: number) => {
    if (onCreateEntry) {
      console.log("Saving entry with data from form handler:", entry, "at index:", index);
      onCreateEntry(
        entry.startTime || startTime,
        entry.endTime || endTime,
        parseFloat(entry.hours.toString()) || calculatedHours
      );
    }
  }, [onCreateEntry]);

  const {
    startTime,
    endTime,
    calculatedHours,
    handleTimeChange
  } = useWorkHours({
    initialStartTime,
    initialEndTime,
    formHandlers,
    interactive
  });

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

  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const hoursVariance = calculateHoursVariance(totalHours, calculatedHours);
  const hasEntries = entries.length > 0;

  const handleSaveEntry = useCallback((index: number) => {
    if (!interactive || !formHandlers[index]) return;

    const formHandler = formHandlers[index];
    const formData = formHandler.getFormData();
    
    console.log("Saving entry with data:", formData);
    
    onCreateEntry?.(
      formData.startTime || startTime,
      formData.endTime || endTime,
      parseFloat(formData.hours.toString()) || calculatedHours
    );
    
    formHandler.resetFormEdited();
    formHandler.resetForm();
    
    setTimeout(() => {
      console.log("Refreshing forms after save");
      refreshForms();
    }, 100);
  }, [interactive, formHandlers, startTime, endTime, calculatedHours, onCreateEntry, refreshForms]);

  // New function to save all pending changes
  const saveAllPendingChanges = useCallback(() => {
    if (!interactive) return;
    
    console.log("Checking all form handlers for pending changes");
    let changesSaved = false;
    
    formHandlers.forEach((handler, index) => {
      if (handler && showEntryForms.includes(index)) {
        if (handler.saveIfEdited()) {
          console.log(`Saved pending changes in form handler ${index}`);
          changesSaved = true;
        }
      }
    });
    
    if (changesSaved) {
      // Refresh forms after saving to ensure clean state
      setTimeout(refreshForms, 100);
    }
    
    return changesSaved;
  }, [formHandlers, showEntryForms, interactive, refreshForms]);

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
    saveAllPendingChanges, // New function added to return value
    
    interactive,
    isUndertime: isUndertime(hoursVariance)
  };
};
