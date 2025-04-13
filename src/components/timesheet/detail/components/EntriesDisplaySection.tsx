
import React from "react";
import { TimeEntry } from "@/types";
import EntryList from "./EntryList";

interface EntriesDisplaySectionProps {
  entries: TimeEntry[];
  hasEntries: boolean;
  formsListKey: number;
}

const EntriesDisplaySection: React.FC<EntriesDisplaySectionProps> = ({
  entries,
  hasEntries,
  formsListKey
}) => {
  if (!hasEntries) return null;
  
  return (
    <EntryList 
      entries={entries}
      key={`entries-list-${entries.length}-${formsListKey}`}
    />
  );
};

export default EntriesDisplaySection;
