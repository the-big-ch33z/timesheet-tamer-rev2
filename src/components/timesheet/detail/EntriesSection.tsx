
import React, { useState, useCallback } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useTimesheetContext } from "@/contexts/timesheet";
import EntriesHeader from "./entries/EntriesHeader";
import EntriesContent from "./entries/EntriesContent";
import EntriesFooter from "./entries/EntriesFooter";
import { useLogger } from "@/hooks/useLogger";
import WorkHoursSection from "./WorkHoursSection";

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
  const [showWorkHoursOnly, setShowWorkHoursOnly] = useState(entries.length === 0);
  const logger = useLogger("EntriesSection");
  
  const { addEntry, deleteEntry, workSchedule } = useTimesheetContext();

  const handleAddEntry = useCallback(() => {
    setIsAddingEntry(true);
    setShowWorkHoursOnly(false);
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

  const handleDeleteEntry = useCallback((id: string) => {
    logger.info("Delete entry requested", { id });
    deleteEntry(id);
  }, [deleteEntry, logger]);

  const handleAddAnotherEntry = useCallback(() => {
    setIsAddingEntry(true);
    setFormKey(Date.now());
  }, []);

  // Set up workflow phase handling
  const completeWorkHoursSetup = useCallback(() => {
    setShowWorkHoursOnly(false);
    handleAddEntry();
  }, [handleAddEntry]);

  return (
    <div className="space-y-4">
      <WorkHoursSection 
        entries={entries} 
        date={date} 
        workSchedule={workSchedule} 
        interactive={entries.length === 0}
      />
      
      <EntriesHeader 
        date={date} 
        readOnly={readOnly} 
        isAddingEntry={isAddingEntry}
        onAddEntry={entries.length === 0 ? completeWorkHoursSetup : handleAddEntry}
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
        onDeleteEntry={handleDeleteEntry}
        workSchedule={workSchedule}
        showWorkHoursOnly={showWorkHoursOnly}
        onWorkHoursComplete={completeWorkHoursSetup}
      />
      
      <EntriesFooter 
        entries={entries}
        readOnly={readOnly}
        isAddingEntry={isAddingEntry}
        onAddEntry={handleAddAnotherEntry}
      />
    </div>
  );
};

export default EntriesSection;
