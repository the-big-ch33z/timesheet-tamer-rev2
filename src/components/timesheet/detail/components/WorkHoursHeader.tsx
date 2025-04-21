
import React, { memo } from "react";
import { Clock } from "lucide-react";
import WorkHoursActionButtons from "./WorkHoursActionButtons";

interface WorkHoursHeaderProps {
  hasEntries: boolean;
  actionStates?: Record<"sick" | "leave" | "toil" | "lunch", boolean>;
  onToggleAction?: (type: "sick" | "leave" | "toil" | "lunch") => void;
}

/**
 * Header component for work hours section
 * Memoized to prevent unnecessary re-renders
 */
const WorkHoursHeader: React.FC<WorkHoursHeaderProps> = memo(({
  hasEntries,
  actionStates,
  onToggleAction,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 gap-2 w-full">
      <div className="flex items-center">
        <Clock className="h-5 w-5 mr-2 text-amber-700 mx-[12px]" />
        <h3 className="text-lg font-medium text-amber-900 mx-0">Work Hours</h3>
      </div>
      {actionStates && onToggleAction && (
        <WorkHoursActionButtons value={actionStates} onToggle={onToggleAction} />
      )}
    </div>
  );
});

WorkHoursHeader.displayName = 'WorkHoursHeader';
export default WorkHoursHeader;
