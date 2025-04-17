
import React from 'react';
import { TimeEntry } from '@/types';
import { Card } from '@/components/ui/card';
import ExistingEntriesList from '../detail/components/ExistingEntriesList';
import { useLogger } from '@/hooks/useLogger';
import TimeEntryForm from '../entry-dialog/form/TimeEntryForm';

interface EntryInterfaceProps {
  date: Date;
  userId: string;
  onCreateEntry: (entry: Omit<TimeEntry, "id">) => string | null;
  onDeleteEntry: (entryId: string) => boolean;
  interactive?: boolean;
  existingEntries: TimeEntry[];
}

const EntryInterface: React.FC<EntryInterfaceProps> = ({
  date,
  userId,
  onCreateEntry,
  onDeleteEntry,
  interactive = true,
  existingEntries
}) => {
  const logger = useLogger('EntryInterface');

  // Handle form submission
  const handleSubmitEntry = (entry: Omit<TimeEntry, "id">) => {
    logger.debug("[EntryInterface] Submitting entry:", entry);
    
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

  return (
    <div className="space-y-4">
      <ExistingEntriesList
        entries={existingEntries}
        date={date}
        interactive={interactive}
        onDeleteEntry={onDeleteEntry}
      />

      {interactive && (
        <div>
          <TimeEntryForm 
            onSubmit={handleSubmitEntry}
            onCancel={() => {}} // Empty function since we're always showing the form
            date={date}
            userId={userId}
          />
        </div>
      )}
    </div>
  );
};

export default EntryInterface;
