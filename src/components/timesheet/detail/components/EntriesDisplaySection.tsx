
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
  // Always display entries regardless of hasEntries flag
  return (
    <EntryList 
      entries={entries}
      key={`entries-list-${entries.length}-${formsListKey}`}
    />
  );
};

export default EntriesDisplaySection;
