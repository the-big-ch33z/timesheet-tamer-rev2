
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import NewEntryForm from "../../entry-display/NewEntryForm";
import TimeEntryList from "../../entry-display/TimeEntryList";
import { useLogger } from "@/hooks/useLogger";

interface EntriesContentProps {
  isAddingEntry: boolean;
  date: Date;
  onCancelAddEntry: () => void;
  onSaveEntry: (entry: Omit<TimeEntry, "id">) => void;
  entries: TimeEntry[];
  readOnly: boolean;
  userId?: string;
  formKey: string;
  onDeleteEntry: (id: string) => void;
  workSchedule?: WorkSchedule;
}

const EntriesContent: React.FC<EntriesContentProps> = ({
  isAddingEntry,
  date,
  onCancelAddEntry,
  onSaveEntry,
  entries,
  readOnly,
  userId,
  formKey,
  onDeleteEntry,
  workSchedule
}) => {
  const logger = useLogger("EntriesContent");
  
  const handleDeleteEntry = (id: string) => {
    logger.info("Delete entry forwarded to parent", { id });
    onDeleteEntry(id);
  };
  
  return (
    <>
      {isAddingEntry && (
        <div>
          <NewEntryForm 
            date={date} 
            onCancel={onCancelAddEntry}
            onSaveEntry={onSaveEntry}
            userId={userId}
            formKey={formKey}
            workSchedule={workSchedule}
          />
        </div>
      )}

      <TimeEntryList 
        entries={entries}
        onDeleteEntry={handleDeleteEntry}
        readOnly={readOnly}
      />
    </>
  );
};

export default EntriesContent;
