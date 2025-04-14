
import React from "react";
import { TimeEntry } from "@/types";
import EntryList from "./EntryList";

interface ExistingEntriesListProps {
  entries: TimeEntry[];
  date: Date;
  interactive?: boolean;
}

const ExistingEntriesList: React.FC<ExistingEntriesListProps> = ({
  entries,
  date,
  interactive = true
}) => {
  // Format date for display
  const formattedDate = date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Log for debugging
  console.debug(`[ExistingEntriesList] Rendering for ${formattedDate}, ${entries.length} entries, interactive=${interactive}`);
  
  return (
    <div className="mt-4">
      {entries.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Existing entries for {formattedDate}:
          </h3>
          <EntryList 
            entries={entries} 
            interactive={interactive} 
          />
        </>
      )}
    </div>
  );
};

export default ExistingEntriesList;
