import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useTimeEntryState } from "../hooks/useTimeEntryState";
import TimeHeader from "../components/TimeHeader";
import ExistingEntriesList from "../components/ExistingEntriesList";
import { DraftProvider } from "@/contexts/timesheet/draft-context/DraftContext";
import DraftEntryCard from "../components/DraftEntryCard";
import NewEntryLauncher from "../components/NewEntryLauncher";
import { useEntriesContext } from "@/contexts/timesheet";

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
    handleTimeChange,
  } = useTimeEntryState({
    entries,
    date,
    workSchedule,
    interactive,
    onCreateEntry
  });
  
  // Get the entries context for direct access to create/delete methods
  const entriesContext = useEntriesContext();
  
  // Handler for creating a new entry from the wizard
  const handleCreateEntryFromWizard = (entry: Omit<TimeEntry, "id">) => {
    console.debug("[TimeEntryManager] Creating entry from wizard", entry);
    
    if (onCreateEntry && entry.hours && typeof entry.hours === 'number') {
      // Use the provided callback if available
      onCreateEntry(
        entry.startTime || startTime,
        entry.endTime || endTime,
        entry.hours
      );
    } else if (entry.hours && typeof entry.hours === 'number') {
      // Otherwise use the context method directly
      entriesContext.createEntry({
        ...entry,
        date: date,
        userId: entry.userId || ''
      });
    }
  };
  
  // We need a userId for the DraftProvider
  const userId = entries.length > 0 ? entries[0].userId : '';
  
  return (
    <DraftProvider selectedDate={date} userId={userId}>
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
        
        {interactive && (
          <div className="mt-4">
            {/* Show draft card if there's a draft */}
            <DraftEntryCard 
              date={date}
              userId={userId}
              onSubmitEntry={handleCreateEntryFromWizard}
            />
            
            {/* Button to create a new entry */}
            <NewEntryLauncher 
              date={date}
              userId={userId}
              onSubmit={handleCreateEntryFromWizard}
            />
          </div>
        )}
      </div>
    </DraftProvider>
  );
};

export default TimeEntryManager;
