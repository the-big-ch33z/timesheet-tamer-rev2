
import React, { useState } from 'react';
import { TimeEntry } from '@/types';
import { Card } from '@/components/ui/card';
import ExistingEntriesList from '../detail/components/ExistingEntriesList';
import { useLogger } from '@/hooks/useLogger';
import TimeEntryForm from '../entry-dialog/form/TimeEntryForm';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [showForm, setShowForm] = useState(false);
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
  
  // Toggle entry form visibility
  const handleToggleForm = () => {
    if (!showForm) {
      // Increment form key to ensure we get a fresh form
      setFormKey(prevKey => prevKey + 1);
    }
    setShowForm(prev => !prev);
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
          {!showForm ? (
            <Button 
              onClick={handleToggleForm}
              className="w-full bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 flex items-center justify-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add New Entry
            </Button>
          ) : (
            <TimeEntryForm 
              key={formKey}
              startTime={startTime}
              endTime={endTime}
              onSubmit={handleSubmitEntry}
              onCancel={() => setShowForm(false)}
              date={date}
              userId={userId}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EntryInterface;
