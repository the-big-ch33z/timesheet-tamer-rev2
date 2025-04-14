
import React, { useEffect } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import TimeHeader from "../components/TimeHeader";
import ExistingEntriesList from "../components/ExistingEntriesList";
import { DraftProvider } from "@/contexts/timesheet/draft-context/DraftContext";
import DraftEntryCard from "../components/DraftEntryCard";
import NewEntryLauncher from "../components/NewEntryLauncher";
import { createTimeLogger } from "@/utils/time/errors";
import { useTimeEntries } from "@/hooks/timesheet/useTimeEntries";
import { useWorkHours } from "@/hooks/timesheet/useWorkHours";
import { useTimeCalculations } from "@/hooks/timesheet/useTimeCalculations";
import { triggerGlobalSave } from "@/contexts/timesheet/TimesheetContext";
import { useTimeEntryState } from "../hooks/useTimeEntryState";

const logger = createTimeLogger('TimeEntryManager');

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
  const currentUserId = window.localStorage.getItem('currentUserId') || 'default-user';
  const userId = entries.length > 0 ? entries[0].userId : currentUserId;
  
  logger.debug(`Using userId: ${userId} for date: ${date}`);
  
  // Use our standardized hooks
  const workHours = useWorkHours(userId);
  const { calculateHours } = useTimeCalculations();
  const timeEntries = useTimeEntries(userId, date);
  
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
    onCreateEntry,
    userId
  });
  
  // Setup auto-save on component unmount
  useEffect(() => {
    return () => {
      logger.debug("TimeEntryManager unmounting - ensuring work hours are saved");
      if (startTime && endTime) {
        workHours.saveWorkHoursForDate(date, startTime, endTime, userId);
      }
    };
  }, [date, userId, startTime, endTime, workHours]);
  
  const handleCreateEntryFromWizard = (entry: Omit<TimeEntry, "id">) => {
    logger.debug("Creating entry from wizard", entry);
    
    // Preserve current work hours state
    const currentStartTime = startTime;
    const currentEndTime = endTime;
    
    // Prepare complete entry with fallbacks to work hour times if not specified
    const completeEntry = {
      ...entry,
      userId: entry.userId || userId,
      date: date,
      startTime: entry.startTime || currentStartTime,
      endTime: entry.endTime || currentEndTime,
      // Auto-calculate hours if missing but have start and end times
      hours: entry.hours || (entry.startTime && entry.endTime ? 
        calculateHours(entry.startTime, entry.endTime) : 
        (currentStartTime && currentEndTime ? calculatedHours : 0))
    };
    
    logger.debug("Complete entry data:", completeEntry);
    
    // Use the provided callback if available, otherwise use our hook method
    if (onCreateEntry && completeEntry.hours && typeof completeEntry.hours === 'number') {
      onCreateEntry(
        completeEntry.startTime,
        completeEntry.endTime,
        completeEntry.hours
      );
    } else if (completeEntry.hours && typeof completeEntry.hours === 'number') {
      logger.debug("Creating entry using hook method", completeEntry);
      timeEntries.createEntry(completeEntry);
    } else {
      logger.error("Cannot create entry - missing hours value");
      return;
    }
    
    // Ensure work hours remain consistent after entry creation
    if (currentStartTime && currentEndTime) {
      setTimeout(() => {
        workHours.saveWorkHoursForDate(date, currentStartTime, currentEndTime, userId);
        logger.debug("Work hours preserved after entry creation:", { 
          startTime: currentStartTime, 
          endTime: currentEndTime 
        });
        
        // Trigger global save to ensure all changes persist
        triggerGlobalSave();
      }, 100);
    }
  };
  
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
            <DraftEntryCard 
              date={date}
              userId={userId}
              onSubmitEntry={handleCreateEntryFromWizard}
              initialValues={{
                startTime,
                endTime
              }}
            />
            
            <NewEntryLauncher 
              date={date}
              userId={userId}
              onSubmit={handleCreateEntryFromWizard}
              initialValues={{
                startTime,
                endTime
              }}
            />
          </div>
        )}
      </div>
    </DraftProvider>
  );
};

export default TimeEntryManager;
