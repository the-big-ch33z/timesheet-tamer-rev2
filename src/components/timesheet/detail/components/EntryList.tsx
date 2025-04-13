
import React, { useEffect } from "react";
import { TimeEntry } from "@/types";
import EntryListItem from "./EntryListItem";
import { format } from "date-fns";

interface EntryListProps {
  entries: TimeEntry[];
}

const EntryList: React.FC<EntryListProps> = ({ entries }) => {
  useEffect(() => {
    console.log("EntryList rendering with entries:", entries.length);
    if (entries.length > 0) {
      entries.forEach(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        console.log("EntryList item date:", format(entryDate, "yyyy-MM-dd"), "Entry id:", entry.id);
      });
    }
  }, [entries]);
  
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
          <EntryListItem 
            key={`entry-${entry.id}`} 
            entry={entry} 
          />
        ))}
      </div>
    </div>
  );
};

export default EntryList;
