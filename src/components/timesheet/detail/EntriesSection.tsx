import React from "react";
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
  // Keep formKey to maintain the component structure
  const formKey = Date.now().toString();
  const logger = useLogger("EntriesSection");
  
  const { deleteEntry } = useTimesheetContext();

  // Simplified no-op functions
  const handleSaveEntry = () => {
    logger.info("Save entry functionality has been removed");
  };

  const handleDeleteEntry = (id: string) => {
    logger.info("Delete entry functionality has been removed");
    deleteEntry(id);
  };

  return (
    <div className="space-y-4">
      <EntriesHeader 
        date={date} 
        readOnly={true} // Always read-only
      />
      
      <EntriesContent
        date={date}
        entries={entries}
        readOnly={true} // Always read-only
        userId={userId}
        formKey={`entry-form-${formKey}`}
        onSaveEntry={handleSaveEntry}
        onDeleteEntry={handleDeleteEntry}
      />
    </div>
  );
};

export default EntriesSection;
