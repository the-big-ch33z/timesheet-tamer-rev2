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
  
  // Simplified no-op functions
  const handleSaveEntry = () => {
    logger.info("Save entry functionality has been removed");
  };

  const handleDeleteEntry = (id: string) => {
    logger.info("Entry functionality has been removed");
  };

  return (
    <div className="space-y-4">
      <EntriesHeader 
        date={date} 
        readOnly={true}
      />
      
      <EntriesContent
        date={date}
        entries={entries}
        readOnly={true}
        userId={userId}
        formKey={`entry-form-${formKey}`}
        onDeleteEntry={handleDeleteEntry}
      />
    </div>
  );
};

export default EntriesSection;
