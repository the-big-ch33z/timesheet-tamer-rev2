import React, { useState } from 'react';
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
  const [showForm, setShowForm] = useState(true);
  const [formKey, setFormKey] = useState(0);

  // Get work hours for the day (from the context via component prop)
  const startTime = existingEntries.length > 0 ? existingEntries[0].startTime || '09:00' : '09:00';
  const endTime = existingEntries.length > 0 ? existingEntries[0].endTime || '17:00' : '17:00';

  // Handle form submission
  const handleSubmitEntry = (entry: Omit<TimeEntry, "id">) => {
    logger.debug("[EntryInterface] Submitting entry:", entry);
    
    try {
      const newEntryId = onCreateEntry(entry);
      
      if (newEntryId) {
        logger.debug("[EntryInterface] Entry created successfully with ID:", newEntryId);
        
        // Reset the form by updating the key instead of hiding it
        setFormKey(prevKey => prevKey + 1);
        
        // Keep the form visible to allow adding multiple entries
        setShowForm(true);
      } else {
        logger.error("[EntryInterface] Failed to create entry");
      }
    } catch (error) {
      logger.error("[EntryInterface] Error creating entry:", error);
    }
  };
  
  // Handle canceling entry creation
  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <ExistingEntriesList
        entries={existingEntries}
        date={date}
        interactive={interactive}
        onDeleteEntry={onDeleteEntry}
      />

      {interactive && showForm && (
        <TimeEntryForm 
          key={formKey}
          startTime={startTime}
          endTime={endTime}
          onSubmit={handleSubmitEntry}
          onCancel={handleCancel}
          date={date}
          userId={userId}
        />
      )}
    </div>
  );
};

export default EntryInterface;
