
import React from "react";
import { Clock } from "lucide-react";

interface WorkHoursHeaderProps {
  hasEntries: boolean;
}

const WorkHoursHeader: React.FC<WorkHoursHeaderProps> = ({ hasEntries }) => {
  return (
    <div className="flex items-center mb-4">
      <Clock className="h-5 w-5 mr-2 text-amber-700" />
      <h3 className="text-lg font-medium text-amber-900">Work Hours</h3>
      {!hasEntries && (
        <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
          No entries yet
        </span>
      )}
    </div>
  );
};

export default WorkHoursHeader;
