
import React from "react";
import { CircleCheck } from "lucide-react";

const TOILEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-7 text-blue-500 opacity-70">
      <CircleCheck className="w-10 h-10 mb-2 opacity-80" />
      <p className="text-center text-base font-medium">No TOIL activity for this month.</p>
      <span className="text-sm text-blue-500/70 mt-1">
        Earn TOIL by working overtime. Log TOIL time off as "TOIL".
      </span>
    </div>
  );
};

export default TOILEmptyState;
