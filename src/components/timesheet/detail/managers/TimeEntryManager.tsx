
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { TimeEntry, WorkSchedule } from "@/types";
import TimeEntryFormManager from "./TimeEntryFormManager";
import { useTimeEntryStats } from "../hooks/useTimeEntryStats";
import { useTimeEntryForm } from "@/hooks/timesheet/useTimeEntryForm";
import { useEntryForms } from "../hooks/useEntryForms";
import { useTimeEntryFormHandling } from "../hooks/useTimeEntryFormHandling";
import { useWorkHours } from "../hooks/useWorkHours";
import HoursStats from "../components/HoursStats";
import TimeRangeDisplay from "../components/TimeRangeDisplay";
import DateDisplay from "../components/DateDisplay";

const MAX_FORM_HANDLERS = 5; // Maximum number of form handlers to create

interface TimeEntryManagerProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

// Create placeholder for userId if not available
const getCurrentUserId = () => {
  return window.localStorage.getItem("currentUserId") || "default-user";
};

const TimeEntryManager: React.FC<TimeEntryManagerProps> = ({
  entries,
  date,
  workSchedule,
  interactive = true,
  onCreateEntry
}) => {
  const userId = useMemo(() => 
    entries.length > 0 ? entries[0].userId : getCurrentUserId(), 
    [entries]
  );
  
  // Get work hours
  const { 
    startTime,
    endTime,
    calculatedHours,
    updateWorkHours 
  } = useWorkHours({ 
    entries, 
    date, 
    workSchedule 
  });

  // Initialize form handlers array
  const formHandlers = useMemo(() => {
    console.debug("[TimeEntryManager] Initializing form handlers array");
    return Array(MAX_FORM_HANDLERS).fill(null).map((_, index) => {
      return useTimeEntryForm({
        formKey: `new-entry-${index}`,
        selectedDate: date,
        userId: userId,
        onSave: (data) => {
          if (onCreateEntry) {
            console.debug(`[TimeEntryManager] Saving form ${index} with data:`, data);
            onCreateEntry(
              data.startTime || startTime, 
              data.endTime || endTime, 
              parseFloat(data.hours.toString()) || calculatedHours
            );
          }
        },
        autoSave: false,
        disabled: !interactive
      });
    });
  }, [date, userId, onCreateEntry, startTime, endTime, calculatedHours, interactive]);

  // Entry form visibility management
  const {
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    key: formKey,
    refreshForms
  } = useEntryForms({
    formHandlers,
    maxForms: MAX_FORM_HANDLERS
  });

  // Time entry form handling
  const {
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

  // Stats for daily entries
  const { totalHours, remainingHours, overHours } = useTimeEntryStats({
    entries,
    calculatedHours,
    workSchedule
  });
  
  // Format date for display
  const formattedDate = useMemo(() => format(date, "EEEE, MMMM d, yyyy"), [date]);

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <DateDisplay date={formattedDate} />
        
        <TimeRangeDisplay
          startTime={startTime}
          endTime={endTime}
          calculatedHours={calculatedHours}
          updateWorkHours={updateWorkHours}
          interactive={interactive}
        />
      </div>
      
      <HoursStats
        totalHours={totalHours}
        remainingHours={remainingHours}
        overHours={overHours}
      />

      {/* Form manager component that handles entry forms */}
      <TimeEntryFormManager
        formHandlers={formHandlers}
        interactive={interactive}
        onCreateEntry={onCreateEntry || (() => {})}
        startTime={startTime}
        endTime={endTime}
        calculatedHours={calculatedHours}
        showEntryForms={showEntryForms}
        addEntryForm={addEntryForm}
        removeEntryForm={removeEntryForm}
        handleSaveEntry={handleSaveEntry}
        saveAllPendingChanges={saveAllPendingChanges}
        key={formKey}
      />
    </div>
  );
};

export default TimeEntryManager;
