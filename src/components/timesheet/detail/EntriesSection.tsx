
import React, { useState, useCallback } from "react";
import { TimeEntry } from "@/types";
import { useTimesheetContext } from "@/contexts/timesheet";
import EntriesHeader from "./entries/EntriesHeader";
import EntriesContent from "./entries/EntriesContent";
import EntriesFooter from "./entries/EntriesFooter";

interface EntriesSectionProps {
  date: Date;
  entries: TimeEntry[];
  readOnly?: boolean;
  userId?: string;
}

const EntriesSection: React.FC<EntriesSectionProps> = ({
  date,
  entries,
  readOnly = false,
  userId
}) => {
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());
  
  const { addEntry, deleteEntry, workSchedule } = useTimesheetContext();

  const handleAddEntry = useCallback(() => {
    setIsAddingEntry(true);
    // Generate new key to ensure clean form reset
    setFormKey(Date.now());
  }, []);

  const handleCancelAddEntry = useCallback(() => {
    setIsAddingEntry(false);
  }, []);

  const handleSaveEntry = useCallback((entry: Omit<TimeEntry, "id">) => {
    // Just pass the entry data to the context handler
    addEntry({
      ...entry,
      userId: entry.userId || userId
    });
    
    // Keep the form open for adding multiple entries
    // But generate a new form key to reset the form state
    setTimeout(() => {
      setFormKey(Date.now());
    }, 300);
  }, [addEntry, userId]);

  return (
    <div className="space-y-4">
      <EntriesHeader 
        date={date} 
        readOnly={readOnly} 
        isAddingEntry={isAddingEntry}
        onAddEntry={handleAddEntry}
      />
      
      <EntriesContent
        isAddingEntry={isAddingEntry}
        date={date}
        onCancelAddEntry={handleCancelAddEntry}
        onSaveEntry={handleSaveEntry}
        entries={entries}
        readOnly={readOnly}
        userId={userId}
        formKey={`entry-form-${formKey}`}
        onDeleteEntry={deleteEntry}
        workSchedule={workSchedule}
      />
      
      <EntriesFooter 
        entries={entries}
        readOnly={readOnly}
        isAddingEntry={isAddingEntry}
        onAddEntry={handleAddEntry}
      />
    </div>
  );
};

export default EntriesSection;
