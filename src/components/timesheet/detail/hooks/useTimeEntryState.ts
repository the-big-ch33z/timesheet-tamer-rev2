
import { useCallback, useEffect, useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useWorkHours } from "./useWorkHours";
import { useTimeEntryForm } from "@/hooks/timesheet/useTimeEntryForm";
import { calculateHoursVariance, isUndertime } from "../utils/timeCalculations";
import { useEntryForms } from "./useEntryForms";
import { format } from "date-fns";

interface UseTimeEntryStateProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

export const useTimeEntryState = ({
  entries,
  date,
  workSchedule,
  interactive,
  onCreateEntry
}: UseTimeEntryStateProps) => {
  // Initialize form handlers for entry forms
  const formHandlers = Array(10).fill(null).map((_, i) => useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => {
      if (onCreateEntry) {
        console.log("Saving entry with data from form handler:", entry);
        onCreateEntry(
          entry.startTime || startTime,
          entry.endTime || endTime,
          parseFloat(entry.hours.toString()) || calculatedHours
        );
      }
    },
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  }));
  
  // Determine initial time values
  let initialStartTime = "09:00";
  let initialEndTime = "17:00";
  
  if (entries.length > 0) {
    initialStartTime = entries[0].startTime || initialStartTime;
    initialEndTime = entries[0].endTime || initialEndTime;
  } else if (workSchedule) {
    const { getWeekDay, getFortnightWeek } = require("../../utils/scheduleUtils");
    
    const weekDay = getWeekDay(date);
    const weekNum = getFortnightWeek(date);
    
    const scheduleDay = workSchedule.weeks[weekNum][weekDay];
    
    if (scheduleDay) {
      initialStartTime = scheduleDay.startTime || initialStartTime;
      initialEndTime = scheduleDay.endTime || initialEndTime;
    }
  }
  
  // Handle time calculations
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
  
  // Setup entry forms management
  const {
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    refreshForms,
    key
  } = useEntryForms({ 
    formHandlers 
  });
  
  // Calculate totals
  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const hoursVariance = calculateHoursVariance(totalHours, calculatedHours);
  const hasEntries = entries.length > 0;
  
  // Handle saving an entry form
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
    
    // Reset the form
    formHandler.resetFormEdited();
    formHandler.resetForm();
    
    // Force a re-render after the entry is added
    setTimeout(() => {
      console.log("Refreshing forms after save");
      refreshForms();
    }, 100);
  }, [interactive, formHandlers, startTime, endTime, calculatedHours, onCreateEntry, refreshForms]);
  
  // Log when entries update
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
    // Time and calculation values
    startTime,
    endTime,
    calculatedHours,
    totalHours,
    hasEntries,
    hoursVariance,
    
    // Form management
    formHandlers,
    showEntryForms,
    key,

    // Event handlers
    handleTimeChange,
    handleSaveEntry,
    addEntryForm,
    removeEntryForm,
    
    // UI state
    interactive,
    isUndertime: isUndertime(hoursVariance)
  };
};
