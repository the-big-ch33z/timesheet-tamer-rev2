
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useTimeEntryState } from "../hooks/useTimeEntryState";
import TimeHeader from "../components/TimeHeader";
import ExistingEntriesList from "../components/ExistingEntriesList";
import TimeEntryFormManager from "./TimeEntryFormManager";

interface TimeEntryManagerProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const TimeEntryManager: React.FC<TimeEntryManagerProps> = ({
  entries,
  date,
  workSchedule,
  interactive = true,
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
    saveAllPendingChanges
  } = useTimeEntryState({
    entries,
    date,
    workSchedule,
    interactive,
    onCreateEntry
  });
  
  return (
    <div>
      <TimeHeader 
        date={date}
        startTime={startTime}
        endTime={endTime}
        calculatedHours={calculatedHours}
        totalHours={totalHours}
        hasEntries={hasEntries}
        hoursVariance={hoursVariance}
        isUndertime={isUndertime}
        onTimeChange={handleTimeChange}
        interactive={interactive}
      />
      
      <ExistingEntriesList 
        entries={entries}
        date={date}
        interactive={interactive}
      />
      
      <TimeEntryFormManager
        formHandlers={formHandlers}
        interactive={interactive}
        onCreateEntry={onCreateEntry!}
        startTime={startTime}
        endTime={endTime}
        calculatedHours={calculatedHours}
        showEntryForms={showEntryForms}
        addEntryForm={addEntryForm}
        removeEntryForm={removeEntryForm}
        handleSaveEntry={handleSaveEntry}
        saveAllPendingChanges={saveAllPendingChanges}
        key={key}
      />
    </div>
  );
};

export default TimeEntryManager;
