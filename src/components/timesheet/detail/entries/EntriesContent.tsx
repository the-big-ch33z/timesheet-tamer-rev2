
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import NewEntryForm from "../../entry-display/NewEntryForm";
import TimeEntryList from "../../entry-display/TimeEntryList";
import WorkHoursSection from "../WorkHoursSection";
import { useLogger } from "@/hooks/useLogger";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
  showWorkHoursOnly?: boolean;
  onWorkHoursComplete?: () => void;
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
  workSchedule,
  showWorkHoursOnly = false,
  onWorkHoursComplete
}) => {
  const logger = useLogger("EntriesContent");
  
  const handleDeleteEntry = (id: string) => {
    logger.info("Delete entry forwarded to parent", { id });
    onDeleteEntry(id);
  };
  
  return (
    <>
      <WorkHoursSection 
        entries={entries} 
        date={date} 
        workSchedule={workSchedule} 
        interactive={entries.length === 0}
      />

      {showWorkHoursOnly && entries.length === 0 && onWorkHoursComplete && (
        <div className="flex justify-center mt-4">
          <Button 
            onClick={onWorkHoursComplete}
            className="bg-blue-800 hover:bg-blue-900 text-white"
          >
            Continue to Add Entry <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {!showWorkHoursOnly && (
        <>
          {isAddingEntry && (
            <div className="mt-4">
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

          <div className="mt-4">
            <TimeEntryList 
              entries={entries}
              onDeleteEntry={handleDeleteEntry}
              readOnly={readOnly}
            />
          </div>
        </>
      )}
    </>
  );
};

export default EntriesContent;
