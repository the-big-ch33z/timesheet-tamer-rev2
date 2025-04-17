import React, { memo } from "react";
import { Clock } from "lucide-react";
interface WorkHoursHeaderProps {
  hasEntries: boolean;
}

/**
 * Header component for work hours section
 * Memoized to prevent unnecessary re-renders
 */
const WorkHoursHeader: React.FC<WorkHoursHeaderProps> = memo(({
  hasEntries
}) => {
  return <div className="flex items-center mb-4">
      <Clock className="h-5 w-5 mr-2 text-amber-700" />
      <h3 className="text-lg font-medium text-amber-900">Work Hours</h3>
      {!hasEntries}
    </div>;
});

// Display name for debugging
WorkHoursHeader.displayName = 'WorkHoursHeader';
export default WorkHoursHeader;