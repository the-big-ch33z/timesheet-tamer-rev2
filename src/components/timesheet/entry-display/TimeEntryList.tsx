
import React from "react";
import { TimeEntry } from "@/types";

interface TimeEntryListProps {
  entries: TimeEntry[];
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
}

const TimeEntryList: React.FC<TimeEntryListProps> = () => {
  return (
    <div className="p-6 text-center bg-gray-50 border rounded-md">
      <p className="text-gray-500">
        Time entries are no longer displayed
      </p>
    </div>
  );
};

export default TimeEntryList;
