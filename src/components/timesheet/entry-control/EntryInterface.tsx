
import React, { useState } from 'react';
import { TimeEntry } from '@/types';
import ExistingEntriesList from '../detail/components/ExistingEntriesList';
import { useLogger } from '@/hooks/useLogger';
import TimeEntryForm from '../entry-dialog/form/TimeEntryForm';

interface EntryInterfaceProps {
  date: Date;
  userId: string;
  onCreateEntry: (entry: Omit<TimeEntry, "id">) => string | null;
  onDeleteEntry: (entryId: string) => Promise<boolean>;
  interactive?: boolean;
  existingEntries: TimeEntry[];
}

/**
 * EntryInterface component responsible for managing time entry creation and display
 * Refactored to use consistent approach across the application
 */
const EntryInterface: React.FC<EntryInterfaceProps> = ({
  date,
  userId,
  onCreateEntry,
  onDeleteEntry,
  interactive = true,
  existingEntries
}) => {
  const logger = useLogger('EntryInterface');
  const [processingEntryIds, setProcessingEntryIds] = useState<Set<string>>(new Set());

  // Handle form submission with standardized logging
  const handleSubmitEntry = (entry: Omit<TimeEntry, "id">) => {
    logger.debug("[EntryInterface] Submitting time entry", {
      date: entry.date,
      hours: entry.hours,
      hasDescription: !!entry.description
    });
    
    try {
      const newEntryId = onCreateEntry(entry);
      
      if (newEntryId) {
        logger.debug("[EntryInterface] Entry created successfully with ID:", newEntryId);
      } else {
        logger.error("[EntryInterface] Failed to create entry");
      }
    } catch (error) {
      logger.error("[EntryInterface] Error creating entry:", error);
    }
  };

  // Enhanced delete entry handler with tracking and logging
  const handleDeleteEntry = async (entryId: string): Promise<boolean> => {
    // Avoid duplicate delete operations
    if (processingEntryIds.has(entryId)) {
      logger.debug("[EntryInterface] Already processing deletion for entry:", entryId);
      return false;
    }
    
    try {
      // Mark as processing
      setProcessingEntryIds(prev => {
        const updated = new Set(prev);
        updated.add(entryId);
        return updated;
      });
      
      // Call the delete handler
      logger.debug("[EntryInterface] Deleting entry:", entryId);
      const result = await onDeleteEntry(entryId);
      
      if (result) {
        logger.debug("[EntryInterface] Entry deleted successfully:", entryId);
      } else {
        logger.error("[EntryInterface] Failed to delete entry:", entryId);
      }
      
      return result;
    } catch (error) {
      logger.error("[EntryInterface] Error deleting entry:", entryId, error);
      return false;
    } finally {
      // Remove from processing set after completion
      setTimeout(() => {
        setProcessingEntryIds(prev => {
          const updated = new Set(prev);
          updated.delete(entryId);
          return updated;
        });
      }, 300); // Small delay to ensure UI updates
    }
  };

  // Reuse the handleCancelForm function for consistent behavior
  const handleCancelForm = () => {
    logger.debug("[EntryInterface] Form cancelled");
    // No-op since we always show the form, but we could add behavior here if needed
  };

  return (
    <div className="space-y-4">
      {existingEntries.length > 0 && (
        <ExistingEntriesList
          entries={existingEntries}
          date={date}
          interactive={interactive}
          onDeleteEntry={handleDeleteEntry}
        />
      )}

      {interactive && (
        <TimeEntryForm 
          onSubmit={handleSubmitEntry}
          onCancel={handleCancelForm}
          date={date}
          userId={userId}
          showTimeInputs={true}
          initialData={{
            startTime: "09:00",
            endTime: "17:00"
          }}
        />
      )}
    </div>
  );
};

export default EntryInterface;
