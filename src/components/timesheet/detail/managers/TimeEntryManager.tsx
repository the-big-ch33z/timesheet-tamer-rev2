
import React from "react";
import { TimeEntry } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import ExistingEntriesList from "../components/ExistingEntriesList";

interface TimeEntryManagerProps {
  entries: TimeEntry[];
  date: Date;
  interactive?: boolean;
  onCreateEntry?: (entry: Omit<TimeEntry, "id">) => string | null;
}

// This is a simplified version of TimeEntryManager to support existing tests
// The actual functionality is now handled by TimeEntryController
const TimeEntryManager: React.FC<TimeEntryManagerProps> = ({
  entries,
  date,
  interactive = true,
  onCreateEntry
}) => {
  const { deleteEntry } = useTimeEntryContext();

  const handleDeleteEntry = async (entryId: string): Promise<boolean> => {
    if (deleteEntry) {
      return await deleteEntry(entryId);
    }
    return Promise.resolve(false);
  };

  return (
    <div className="space-y-4">
      <ExistingEntriesList
        entries={entries}
        date={date}
        interactive={interactive}
        onDeleteEntry={handleDeleteEntry}
      />
      {/* Note: New entry functionality is now in EntryInterface component */}
    </div>
  );
};

export default TimeEntryManager;
