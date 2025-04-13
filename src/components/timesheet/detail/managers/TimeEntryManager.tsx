
import React, { useEffect, useCallback } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useTimeEntryState } from "../hooks/useTimeEntryState";
import TimeHeaderSection from "../components/TimeHeaderSection";
import EntriesDisplaySection from "../components/EntriesDisplaySection";
import WorkHoursAlerts from "../components/WorkHoursAlerts";
import TimeEntryFormManager from "./TimeEntryFormManager";

interface TimeEntryManagerProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const TimeEntryManager: React.FC<TimeEntryManagerProps> = ({
  entries,
  date,
  workSchedule,
  interactive,
  onCreateEntry
}) => {
  const {
    startTime,
    endTime,
    calculatedHours,
    totalHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    
    formHandlers,
    showEntryForms,
    key,
    
    handleTimeChange,
    handleSaveEntry,
    addEntryForm,
    removeEntryForm,
    saveAllPendingChanges // New function to save all pending changes
  } = useTimeEntryState({ 
    entries, 
    date, 
    workSchedule, 
    interactive,
    onCreateEntry
  });

  // Add a global event listener for saving pending changes
  useEffect(() => {
    if (!interactive) return;

    const handleSavePendingChanges = () => {
      console.log("TimeEntryManager: Global save event received");
      saveAllPendingChanges();
    };

    window.addEventListener('timesheet:save-pending-changes', handleSavePendingChanges);
    return () => {
      window.removeEventListener('timesheet:save-pending-changes', handleSavePendingChanges);
    };
  }, [saveAllPendingChanges, interactive]);

  return (
    <div key={`entry-manager-${key}`} className="space-y-4">
      {/* Header section with time display */}
      <TimeHeaderSection
        hasEntries={hasEntries}
        startTime={startTime}
        endTime={endTime}
        calculatedHours={calculatedHours}
        totalHours={totalHours}
        interactive={interactive}
        onTimeChange={handleTimeChange}
      />
      
      {/* Alerts for overtime/undertime */}
      <WorkHoursAlerts
        hasEntries={hasEntries}
        hoursVariance={hoursVariance}
        isUndertime={isUndertime}
        interactive={interactive}
        showEntryForms={showEntryForms.length > 0}
      />
      
      {/* Time entry form manager */}
      {interactive && (
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
          key={key}
        />
      )}
      
      {/* Display existing entries */}
      <EntriesDisplaySection
        entries={entries}
        hasEntries={hasEntries}
        formsListKey={key}
      />
    </div>
  );
};

export default TimeEntryManager;
