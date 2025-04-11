
import React, { useState, useCallback } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import NewEntryForm from "../entry-display/NewEntryForm";
import { v4 as uuidv4 } from "uuid";
import TimeEntryList from "../entry-display/TimeEntryList";
import AddEntryButton from "../entry-display/AddEntryButton";

interface EntriesSectionProps {
  date: Date;
  entries: TimeEntry[];
  onAddEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
  workSchedule?: WorkSchedule;
  userId?: string;
}

const EntriesSection: React.FC<EntriesSectionProps> = ({
  date,
  entries,
  onAddEntry,
  onDeleteEntry,
  readOnly = false,
  workSchedule,
  userId
}) => {
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());

  const handleAddEntry = useCallback(() => {
    setIsAddingEntry(true);
    // Generate new key to ensure clean form reset
    setFormKey(Date.now());
  }, []);

  const handleCancelAddEntry = useCallback(() => {
    setIsAddingEntry(false);
  }, []);

  const handleSaveEntry = useCallback((entry: Omit<TimeEntry, "id">) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: uuidv4(),
      userId: userId
    };
    
    // Call the parent handler with the new entry
    onAddEntry(newEntry);
    
    // Keep the form open for adding multiple entries
    // But generate a new form key to reset the form state
    setTimeout(() => {
      setFormKey(Date.now());
    }, 300);
  }, [onAddEntry, userId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Entries for {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</h3>
        {!readOnly && !isAddingEntry && (
          <div className="flex gap-2">
            {/* These buttons are for illustration to match the image - they're not functional */}
            <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
              <span className="sr-only">User profile</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
              <span className="sr-only">Settings</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
              <span className="sr-only">Clock</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
              <span className="sr-only">Menu</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M13.5 3H12H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V8.625M13.5 3L19 8.625M13.5 3V7.625C13.5 8.17728 13.9477 8.625 14.5 8.625H19"/></svg>
            </Button>
            <AddEntryButton onClick={handleAddEntry} date={date} />
          </div>
        )}
      </div>

      {isAddingEntry && (
        <div>
          <NewEntryForm 
            date={date} 
            onSaveEntry={handleSaveEntry} 
            onCancel={handleCancelAddEntry}
            workSchedule={workSchedule}
            userId={userId}
            formKey={`entry-form-${formKey}`}
          />
        </div>
      )}

      <TimeEntryList 
        entries={entries}
        onDeleteEntry={onDeleteEntry}
        readOnly={readOnly}
      />
      
      {/* Show add entry button at the bottom for adding more entries */}
      {!readOnly && entries.length > 0 && !isAddingEntry && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={handleAddEntry}
            className="w-full max-w-xs border-dashed"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Another Entry
          </Button>
        </div>
      )}
    </div>
  );
};

export default EntriesSection;
