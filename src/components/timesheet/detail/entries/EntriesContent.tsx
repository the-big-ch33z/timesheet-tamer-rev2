import React from "react";
import { TimeEntry } from "@/types";
import TimeEntryList from "../../entry-display/TimeEntryList";
import { useLogger } from "@/hooks/useLogger";

interface EntriesContentProps {
  date: Date;
  entries: TimeEntry[];
  readOnly: boolean;
  userId?: string;
  formKey: string;
  onSaveEntry: (entry: Omit<TimeEntry, "id">) => void;
  onDeleteEntry: (id: string) => void;
}

const EntriesContent: React.FC<EntriesContentProps> = ({
  entries,
  readOnly,
  onDeleteEntry
}) => {
  const logger = useLogger("EntriesContent");
  
  const handleDeleteEntry = (id: string) => {
    logger.info("Delete entry forwarded to parent", { id });
    onDeleteEntry(id);
  };
  
  return (
    <div className="mt-4">
      <TimeEntryList 
        entries={entries}
        onDeleteEntry={handleDeleteEntry}
        readOnly={readOnly}
      />
    </div>
  );
};

export default EntriesContent;
