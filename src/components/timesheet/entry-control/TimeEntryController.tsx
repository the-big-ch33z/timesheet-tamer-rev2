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
      logger.debug('[TimeEntryController] Submitting entry:', entryData);

      const newEntryId = createEntry({
        ...entryData,
        date,
        userId
      });

      if (newEntryId) {
        // If successful and we have a callback, also call it
        if (onCreateEntry) {
          const { startTime, endTime } = getWorkHoursForDate(date, userId);
          onCreateEntry(startTime, endTime, entryData.hours || 0);
        }

        toast({
          title: "Entry created",
          description: `Added ${entryData.hours} hours to your timesheet`
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
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
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

      <div className="mb-4">
        <ExistingEntriesList
          entries={dayEntries}
          date={date}
          interactive={interactive}
          onDeleteEntry={handleDeleteEntry}
        />
      </div>

      {showEntryForm && (
        <EntryInterface 
          date={date} 
          userId={userId} 
          onCreateEntry={handleEntrySubmit}
          onDeleteEntry={handleDeleteEntry}
          interactive={interactive} 
          existingEntries={dayEntries}
          isSubmitting={isSubmitting}
        />
      )}
    </Card>
  );
};

export default React.memo(TimeEntryController);
