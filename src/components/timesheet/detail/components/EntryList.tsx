
import React, { useState, useCallback } from "react";
import { TimeEntry } from "@/types";
import EntryListItem from "./EntryListItem";
import { useTimesheetWorkHours } from "@/hooks/timesheet/useTimesheetWorkHours";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No entries for this day
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Hours</TableHead>
            <TableHead className="w-[100px]">Rego</TableHead>
            <TableHead className="w-[120px]">Job Number</TableHead>
            <TableHead className="w-[120px]">Task Number</TableHead>
            <TableHead className="flex-1">Description</TableHead>
            {interactive && <TableHead className="w-[80px] text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
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
        </TableBody>
      </Table>
    </div>
  );
};

export default EntryList;
