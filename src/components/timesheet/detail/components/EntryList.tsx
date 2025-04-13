
import React from "react";
import { TimeEntry } from "@/types";
import EntryListItem from "./EntryListItem";

interface EntryListProps {
  entries: TimeEntry[];
}

const EntryList: React.FC<EntryListProps> = ({ entries }) => {
  console.log("EntryList entries:", entries);
  
  if (entries.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No time entries for this day.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Time Entries:</h3>
      <div className="space-y-2">
        {entries.map(entry => (
          <EntryListItem key={`entry-${entry.id}`} entry={entry} />
        ))}
      </div>
    </div>
  );
};

export default EntryList;
