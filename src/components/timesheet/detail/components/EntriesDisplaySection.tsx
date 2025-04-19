
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
  // Remove the conditional return so entries are always displayed
  return (
    <EntryList 
      entries={entries}
      key={`entries-list-${entries.length}-${formsListKey}`}
    />
  );
};

export default EntriesDisplaySection;
