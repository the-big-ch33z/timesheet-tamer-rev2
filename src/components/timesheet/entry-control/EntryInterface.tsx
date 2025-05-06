
import React from 'react';
import { TimeEntry } from '@/types';
import { useLogger } from '@/hooks/useLogger';
import TimeEntryForm from '../entry-dialog/form/TimeEntryForm';

interface EntryInterfaceProps {
  date: Date;
  userId: string;
  onCreateEntry: (entry: Omit<TimeEntry, "id">) => void;
  onDeleteEntry: (entryId: string) => Promise<boolean>;
  interactive?: boolean;
  existingEntries: TimeEntry[];
  isSubmitting: boolean;
}

const EntryInterface: React.FC<EntryInterfaceProps> = ({
  date,
  userId,
  onCreateEntry,
  onDeleteEntry,
  interactive = true,
  existingEntries,
  isSubmitting
}) => {
  const logger = useLogger('EntryInterface');

  const handleSubmitEntry = (entry: Omit<TimeEntry, "id">) => {
    logger.debug("[EntryInterface] Forwarding entry submission", {
      date: entry.date,
      hours: entry.hours,
      hasDescription: !!entry.description
    });
    
    // Ensure hours is a number and valid before submitting
    const numericHours = typeof entry.hours === 'string' 
      ? parseFloat(entry.hours) 
      : entry.hours;
    
    if (isNaN(numericHours) || numericHours <= 0) {
      logger.error("[EntryInterface] Invalid hours value:", entry.hours, "parsed as:", numericHours);
      return;
    }
    
    // Create a new entry object with validated hours value
    const validatedEntry = {
      ...entry,
      hours: numericHours
    };
    
    // Pass the validated entry to parent handler
    logger.debug("[EntryInterface] Submitting validated entry with hours:", numericHours);
    onCreateEntry(validatedEntry);
  };

  const handleCancelForm = () => {
    logger.debug("[EntryInterface] Form cancelled");
  };

  return (
    <div className="space-y-4">
      {interactive && (
        <TimeEntryForm 
          onSubmit={handleSubmitEntry}
          onCancel={handleCancelForm}
          date={date}
          userId={userId}
          initialData={{}}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default EntryInterface;
