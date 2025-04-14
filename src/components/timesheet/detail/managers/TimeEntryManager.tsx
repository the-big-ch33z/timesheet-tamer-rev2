import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useTimeEntryState } from "../hooks/useTimeEntryState";
import TimeHeader from "../components/TimeHeader";
import ExistingEntriesList from "../components/ExistingEntriesList";
import { DraftProvider } from "@/contexts/timesheet/draft-context/DraftContext";
import DraftEntryCard from "../components/DraftEntryCard";
import NewEntryLauncher from "../components/NewEntryLauncher";
import { useEntriesContext } from "@/contexts/timesheet";
import { useWorkHoursContext } from "@/contexts/timesheet/work-hours-context/WorkHoursContext";
import { createTimeLogger } from "@/utils/time/errors";

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
  
  const workHoursContext = useWorkHoursContext();
  
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
  
  const entriesContext = useEntriesContext();
  
  const handleCreateEntryFromWizard = (entry: Omit<TimeEntry, "id">) => {
    logger.debug("Creating entry from wizard", entry);
    logger.debug("Current work hours BEFORE entry creation:", { startTime, endTime });
    
    const currentStartTime = startTime;
    const currentEndTime = endTime;
    
    const completeEntry = {
      ...entry,
      userId: entry.userId || userId,
      date: date,
      startTime: entry.startTime || currentStartTime,
      endTime: entry.endTime || currentEndTime
    };
    
    logger.debug("Complete entry data:", completeEntry);
    
    if (onCreateEntry && entry.hours && typeof entry.hours === 'number') {
      onCreateEntry(
        completeEntry.startTime,
        completeEntry.endTime,
        entry.hours
      );
    } else if (entry.hours && typeof entry.hours === 'number') {
      logger.debug("Creating entry using context method", completeEntry);
      entriesContext.createEntry(completeEntry);
    } else {
      logger.error("Cannot create entry - missing hours value");
    }
    
    if (currentStartTime && currentEndTime) {
      setTimeout(() => {
        workHoursContext.saveWorkHours(date, userId, currentStartTime, currentEndTime);
        logger.debug("Work hours preserved AFTER entry creation:", { 
          startTime: currentStartTime, 
          endTime: currentEndTime 
        });
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
