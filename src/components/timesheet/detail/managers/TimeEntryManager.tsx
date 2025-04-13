
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useTimeEntryState } from "../hooks/useTimeEntryState";
import TimeEntryFormManager from "./TimeEntryFormManager";
import TimeHeaderSection from "../components/TimeHeaderSection";
import EntriesDisplaySection from "../components/EntriesDisplaySection";
import WorkHoursAlerts from "../components/WorkHoursAlerts";

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
    
    addFormHandler
  } = useTimeEntryState({ 
    entries, 
    date, 
    workSchedule, 
    interactive,
    onCreateEntry
  });

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
          addFormHandler={addFormHandler}
        />
      )}
      
      {/* Display existing entries */}
      <EntriesDisplaySection
        entries={entries}
        interactive={interactive}
      />
    </div>
  );
};

export default TimeEntryManager;
