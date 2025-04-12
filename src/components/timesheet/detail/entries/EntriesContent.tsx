
import React from "react";
import { TimeEntry } from "@/types";

interface EntriesContentProps {
  date: Date;
  entries: TimeEntry[];
  readOnly: boolean;
  userId?: string;
  formKey: string;
  onDeleteEntry: (id: string) => void;
}

const EntriesContent: React.FC<EntriesContentProps> = () => {
  return (
    <div className="mt-4">
      {/* Timesheet entry display has been removed */}
      <div className="p-6 text-center bg-gray-50 border rounded-md">
        <p className="text-gray-500">
          Timesheet entry display has been disabled
        </p>
      </div>
    </div>
  );
};

export default EntriesContent;
