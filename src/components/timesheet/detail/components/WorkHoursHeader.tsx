
import React from 'react';

interface WorkHoursHeaderProps {
  hasEntries: boolean;
}

const WorkHoursHeader: React.FC<WorkHoursHeaderProps> = ({ hasEntries }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800">Work Hours</h3>
      {!hasEntries && (
        <p className="text-sm text-gray-500">
          Enter your work hours for this day
        </p>
      )}
    </div>
  );
};

export default WorkHoursHeader;
