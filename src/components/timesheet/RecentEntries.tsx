
import React from "react";
import { format } from "date-fns";
import { TimeEntry } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import EntryList from "./detail/components/EntryList";

interface RecentEntriesProps {
  entries: TimeEntry[];
}

const RecentEntries: React.FC<RecentEntriesProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-medium mb-4">Recent Time Entries</h3>
        <p className="text-gray-500 text-center py-4">No recent entries</p>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
      <h3 className="text-lg font-medium mb-4">Recent Time Entries</h3>
      <EntryList entries={entries} />
    </div>
  );
};

export default RecentEntries;
