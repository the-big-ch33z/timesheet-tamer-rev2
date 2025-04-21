
import React, { memo } from "react";
import { Clock } from "lucide-react";
import { WorkHoursActionType } from "./WorkHoursActionButtons";

interface WorkHoursHeaderProps {
  hasEntries: boolean;
  actionStates?: Record<WorkHoursActionType, boolean>;
  onToggleAction?: (type: WorkHoursActionType) => void;
}

/**
 * Header component for work hours section
 * Memoized to prevent unnecessary re-renders
 */
const WorkHoursHeader: React.FC<WorkHoursHeaderProps> = memo(({
  hasEntries,
}) => {
  return (
    <div className="flex items-center mb-4 gap-2 w-full">
      <div className="flex items-center">
        <Clock className="h-5 w-5 mr-2 text-amber-700 mx-[12px]" />
        <h3 className="text-lg font-medium text-amber-900 mx-0">Work Hours</h3>
      </div>
    </div>
  );
});

WorkHoursHeader.displayName = 'WorkHoursHeader';
export default WorkHoursHeader;
