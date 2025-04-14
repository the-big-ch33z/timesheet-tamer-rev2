
import React from "react";
import { TimeEntry } from "@/types";
import { format } from "date-fns";
import EntryList from "./EntryList";

interface ExistingEntriesListProps {
  entries: TimeEntry[];
  date: Date;
  interactive: boolean;
}

const ExistingEntriesList: React.FC<ExistingEntriesListProps> = ({
  entries,
  date,
  interactive
}) => {
  // Filter entries for the current date
  const filteredEntries = entries.filter(entry => {
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    return format(entryDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
  });
  
  // Don't render if there are no entries
  if (filteredEntries.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">
        Existing Entries ({filteredEntries.length})
      </h3>
      <EntryList 
        entries={filteredEntries}
        interactive={interactive}
      />
    </div>
  );
};

export default ExistingEntriesList;
