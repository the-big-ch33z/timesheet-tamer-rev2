
import React from "react";
import { TimeEntry } from "@/types";

interface EntriesFooterProps {
  entries: TimeEntry[];
  readOnly: boolean;
  isAddingEntry: boolean;
  onAddEntry: () => void;
}

const EntriesFooter: React.FC<EntriesFooterProps> = ({
  entries,
  readOnly,
  isAddingEntry,
  onAddEntry
}) => {
  // Component no longer shows any UI
  return null;
};

export default EntriesFooter;
