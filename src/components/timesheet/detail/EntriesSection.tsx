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
  // We'll keep formKey for now to maintain the prop structure
  const formKey = Date.now().toString();
  const logger = useLogger("EntriesSection");
  
  const { deleteEntry } = useTimesheetContext();

  // This is a placeholder function that satisfies the interface but won't be actively used
  const handleSaveEntry = () => {
    logger.info("Save entry functionality has been removed");
  };

  const handleDeleteEntry = (id: string) => {
    logger.info("Delete entry requested", { id });
    deleteEntry(id);
  };

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
