
import React, { useState, useCallback } from "react";
import { TimeEntry } from "@/types";
import EntryListItem from "./EntryListItem";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";

interface EntryListProps {
  entries: TimeEntry[];
  interactive?: boolean;
  onDeleteEntry?: (entryId: string) => Promise<boolean>;
}

const EntryList: React.FC<EntryListProps> = ({
  entries,
  interactive = true,
  onDeleteEntry
}) => {
  const { getWorkHoursForDate } = useTimesheetWorkHours();

  const [processingEntryIds, setProcessingEntryIds] = useState<Set<string>>(new Set());
  
  const handleDeleteEntry = useCallback(async (entryId: string) => {
    if (!onDeleteEntry) return;
    
    setProcessingEntryIds(prev => {
      const updated = new Set(prev);
      updated.add(entryId);
      return updated;
    });
    
    try {
      await onDeleteEntry(entryId);
    } finally {
      setProcessingEntryIds(prev => {
        const updated = new Set(prev);
        updated.delete(entryId);
        return updated;
      });
    }
  }, [onDeleteEntry]);

  return (
    <div className="space-y-4">
      {entries.map(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        const workHours = getWorkHoursForDate(entryDate, entry.userId);
        
        return (
          <EntryListItem
            key={entry.id}
            entry={entry}
            onDelete={() => handleDeleteEntry(entry.id)}
            interactive={interactive}
            isDeleting={processingEntryIds.has(entry.id)}
          />
        );
      })}
    </div>
  );
};

export default EntryList;
