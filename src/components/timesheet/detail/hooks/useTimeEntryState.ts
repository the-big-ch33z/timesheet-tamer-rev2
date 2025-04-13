
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

export const useTimeEntryState = ({
  entries,
  date,
  workSchedule,
  interactive,
  onCreateEntry
}: UseTimeEntryStateProps) => {
  // Instead of creating all form handlers upfront, we'll create a small initial set
  // and add more only when needed
  const [formHandlers, setFormHandlers] = useState<ReturnType<typeof useTimeEntryForm>[]>([]);
  
  // Initialize with a single form handler
  useEffect(() => {
    if (formHandlers.length === 0) {
      const initialHandler = useTimeEntryForm({
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
      });
      
      setFormHandlers([initialHandler]);
    }
  }, []);

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

  // Create a function to add new form handlers on demand
  const addFormHandler = useCallback(() => {
    if (formHandlers.length >= 10) return; // Limit to 10 form handlers
    
    const newHandler = useTimeEntryForm({
      selectedDate: date,
      onSave: (entry) => {
        if (onCreateEntry) {
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
    });
    
    setFormHandlers(prev => [...prev, newHandler]);
  }, [date, startTime, endTime, calculatedHours, onCreateEntry, interactive]);

  const {
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    refreshForms,
    key
  } = useEntryForms({ 
    formHandlers,
    onNeedMoreHandlers: addFormHandler
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
    
    interactive,
    isUndertime: isUndertime(hoursVariance)
  };
};
