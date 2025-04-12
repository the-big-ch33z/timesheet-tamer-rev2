
import React, { useState, useCallback } from "react";
import { TimeEntry } from "@/types";
import { useTimesheetContext } from "@/contexts/timesheet";
import EntriesHeader from "./entries/EntriesHeader";
import EntriesContent from "./entries/EntriesContent";
import { useLogger } from "@/hooks/useLogger";

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
  const [formKey, setFormKey] = useState(Date.now());
  const logger = useLogger("EntriesSection");
  
  const { addEntry, deleteEntry } = useTimesheetContext();

  const handleSaveEntry = useCallback((entry: Omit<TimeEntry, "id">) => {
    // Just pass the entry data to the context handler
    addEntry({
      ...entry,
      userId: entry.userId || userId
    });
    
    // Generate a new form key to reset the form state
    setTimeout(() => {
      setFormKey(Date.now());
    }, 300);
  }, [addEntry, userId]);

  const handleDeleteEntry = useCallback((id: string) => {
    logger.info("Delete entry requested", { id });
    deleteEntry(id);
  }, [deleteEntry, logger]);

  return (
    <div className="space-y-4">
      <EntriesHeader 
        date={date} 
        readOnly={readOnly}
      />
      
      <EntriesContent
        date={date}
        entries={entries}
        readOnly={readOnly}
        userId={userId}
        formKey={`entry-form-${formKey}`}
        onSaveEntry={handleSaveEntry}
        onDeleteEntry={handleDeleteEntry}
      />
    </div>
  );
};

export default EntriesSection;
