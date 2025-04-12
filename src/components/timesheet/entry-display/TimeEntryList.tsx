
import React from "react";
import { TimeEntry } from "@/types";
import { LockIcon } from "lucide-react";

interface TimeEntryListProps {
  entries: TimeEntry[];
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
}

const TimeEntryList: React.FC<TimeEntryListProps> = ({ 
  entries
}) => {
  return (
    <div className="p-6 text-center bg-gray-50 border rounded-md">
      <div className="flex flex-col items-center gap-2">
        <LockIcon className="h-5 w-5 text-gray-400" />
        <p className="text-gray-500">
          {entries.length > 0 
            ? `${entries.length} time entries recorded (view only)` 
            : "No time entries for this day (view only)"}
        </p>
      </div>
    </div>
  );
};

export default TimeEntryList;
