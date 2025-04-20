
import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TimeEntry } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/TimeEntryContext";
import { useLogger } from "@/hooks/useLogger";
import EntryInterface from "./EntryInterface";

// Standard toast message patterns
const TOAST_MESSAGES = {
  CREATE_SUCCESS: (hours: number) => `Added ${hours} hours to your timesheet`,
  DELETE_SUCCESS: "Entry deleted successfully",
  ERROR: "There was a problem with the operation"
};

interface TimeEntryControllerProps {
  date: Date;
  userId: string;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

/**
 * Controller component for managing time entries
 * Refactored for consistent entry handling patterns
 */
const TimeEntryController: React.FC<TimeEntryControllerProps> = ({
  date,
  userId,
  interactive = true,
  onCreateEntry
}) => {
  const logger = useLogger('TimeEntryController');
  const [showEntryForm, setShowEntryForm] = useState(false);

  // Use our context to get access to entries and operations
  const {
    createEntry,
    deleteEntry,
    getDayEntries
  } = useTimeEntryContext();

  // Get entries for the current day
  const dayEntries = getDayEntries(date);

  // Toggle entry form visibility
  const handleToggleEntryForm = () => {
    logger.debug(`[TimeEntryController] Toggling entry form visibility: ${!showEntryForm}`);
    setShowEntryForm(prev => !prev);
  };

  // Standard operation wrapper for entry creation
  const handleCreateEntry = useCallback((entryData: Omit<TimeEntry, "id">) => {
    logger.debug('[TimeEntryController] Creating entry', {
      date: entryData.date,
      userId: entryData.userId,
      hours: entryData.hours,
      hasStartTime: !!entryData.startTime,
      hasEndTime: !!entryData.endTime
    });

    // Use the context to create the entry
    const newEntryId = createEntry({
      ...entryData,
      date,
      userId
    });

    // If successful and we have a callback, also call it
    if (newEntryId && onCreateEntry && entryData.startTime && entryData.endTime) {
      onCreateEntry(entryData.startTime, entryData.endTime, entryData.hours || 0);
    }
    return newEntryId;
  }, [createEntry, date, userId, onCreateEntry, logger]);

  // Standard operation wrapper for entry deletion
  const handleDeleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    logger.debug('[TimeEntryController] Deleting entry', {
      entryId
    });
    return deleteEntry(entryId);
  }, [deleteEntry, logger]);
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Timesheet Entries</h3>
        {interactive && (
          <Button 
            onClick={handleToggleEntryForm} 
            variant="outline" 
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {showEntryForm ? "Hide Form" : "Add Entry"}
          </Button>
        )}
      </div>

      {showEntryForm && (
        <EntryInterface 
          date={date} 
          userId={userId} 
          onCreateEntry={handleCreateEntry} 
          onDeleteEntry={handleDeleteEntry} 
          interactive={interactive} 
          existingEntries={dayEntries} 
        />
      )}
    </Card>
  );
};

export default React.memo(TimeEntryController);
