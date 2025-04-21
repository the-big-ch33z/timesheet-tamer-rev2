
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TimeEntry } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/TimeEntryContext";
import { useLogger } from "@/hooks/useLogger";
import EntryInterface from "./EntryInterface";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import ExistingEntriesList from "../detail/components/ExistingEntriesList";
import { useToast } from "@/hooks/use-toast";
import { TOIL_JOB_NUMBER } from "@/utils/time/services/toil-service";

// Define the interface for TimeEntryController props
interface TimeEntryControllerProps {
  date: Date;
  userId: string;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const TimeEntryController: React.FC<TimeEntryControllerProps> = ({
  date,
  userId,
  interactive = true,
  onCreateEntry
}) => {
  const logger = useLogger('TimeEntryController');
  const { toast } = useToast();
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getWorkHoursForDate } = useTimesheetWorkHours();

  // Use our context to get access to entries and operations
  const {
    createEntry,
    deleteEntry,
    getDayEntries
  } = useTimeEntryContext();

  // Get entries for the current day
  const dayEntries = getDayEntries(date);

  // Centralized submission handler
  const handleEntrySubmit = useCallback(async (entryData: Omit<TimeEntry, "id">) => {
    if (isSubmitting) {
      logger.debug('[TimeEntryController] Submission already in progress, skipping');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Check if this is a TOIL usage entry
      const isToilUsage = entryData.jobNumber === TOIL_JOB_NUMBER;
      
      if (isToilUsage) {
        logger.debug('[TimeEntryController] Creating TOIL usage entry:', entryData.hours);
      }
      
      logger.debug('[TimeEntryController] Submitting entry:', entryData);

      const newEntryId = createEntry({
        ...entryData,
        date,
        userId
      });

      if (newEntryId) {
        // Notify parent about the creation but don't create again
        // This is for reporting/UI updates only, not creating another entry
        if (onCreateEntry) {
          const { startTime, endTime } = getWorkHoursForDate(date, userId);
          onCreateEntry(startTime, endTime, entryData.hours || 0);
        }

        toast({
          title: isToilUsage ? "TOIL Usage recorded" : "Entry created",
          description: isToilUsage 
            ? `Used ${entryData.hours} hours from your TOIL balance` 
            : `Added ${entryData.hours} hours to your timesheet`
        });

        setShowEntryForm(false); // Auto-hide form after successful submission
      }
    } catch (error) {
      logger.error('[TimeEntryController] Error submitting entry:', error);
      toast({
        title: "Error",
        description: "Failed to create time entry",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [createEntry, date, userId, onCreateEntry, getWorkHoursForDate, isSubmitting, toast, logger]);

  // Handle deletion with submission lock check
  const handleDeleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    if (isSubmitting) {
      logger.debug('[TimeEntryController] Operation in progress, skipping delete');
      return false;
    }

    try {
      setIsSubmitting(true);
      logger.debug('[TimeEntryController] Deleting entry:', entryId);
      return await deleteEntry(entryId);
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteEntry, isSubmitting, logger]);

  return (
    <Card className="p-0 m-0 w-full rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4 px-4 pt-4">
        <h3 className="text-lg font-medium">Timesheet Entries</h3>
        {interactive && (
          <Button 
            onClick={() => setShowEntryForm(!showEntryForm)} 
            variant="outline"
            disabled={isSubmitting}
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {showEntryForm ? "Hide Form" : "Add Entry"}
          </Button>
        )}
      </div>

      <div className="mb-4 px-4">
        <ExistingEntriesList
          entries={dayEntries}
          date={date}
          interactive={interactive}
          onDeleteEntry={handleDeleteEntry}
        />
      </div>

      {showEntryForm && (
        <div className="px-4 pb-4">
          <EntryInterface 
            date={date} 
            userId={userId} 
            onCreateEntry={handleEntrySubmit}
            onDeleteEntry={handleDeleteEntry}
            interactive={interactive} 
            existingEntries={dayEntries}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </Card>
  );
};

export default React.memo(TimeEntryController);

