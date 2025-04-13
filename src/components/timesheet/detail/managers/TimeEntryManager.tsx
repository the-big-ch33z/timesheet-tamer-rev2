
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useTimeEntryState } from "../hooks/useTimeEntryState";
import TimeHeaderSection from "../components/TimeHeaderSection";
import WorkHoursAlerts from "../components/WorkHoursAlerts";
import EntriesDisplaySection from "../components/EntriesDisplaySection";
import EntryFormsSection from "../components/EntryFormsSection";

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
  // Use the custom hook to manage all timesheet state
  const {
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
    interactive: isInteractive,
    isUndertime
  } = useTimeEntryState({
    entries,
    date,
    workSchedule,
    interactive,
    onCreateEntry
  });

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      {/* Time Display and Header Section */}
      <TimeHeaderSection 
        hasEntries={hasEntries}
        startTime={startTime}
        endTime={endTime}
        calculatedHours={calculatedHours}
        totalHours={totalHours}
        interactive={interactive}
        onTimeChange={handleTimeChange}
      />
      
      {/* Alerts Section */}
      <WorkHoursAlerts
        hasEntries={hasEntries}
        isUndertime={isUndertime}
        hoursVariance={hoursVariance}
        interactive={interactive}
        showEntryForms={showEntryForms.length > 0}
      />
      
      {/* Entries List Section */}
      <EntriesDisplaySection 
        entries={entries}
        hasEntries={hasEntries}
        formsListKey={key}
      />
      
      {/* Entry Forms and Add Button Section */}
      <EntryFormsSection 
        showEntryForms={showEntryForms}
        formHandlers={formHandlers}
        handleSaveEntry={handleSaveEntry}
        removeEntryForm={removeEntryForm}
        addEntryForm={addEntryForm}
        interactive={interactive}
      />
    </div>
  );
};

export default TimeEntryManager;
