
import React from "react";
import { AlertTriangle } from "lucide-react";

const TOILNegativeBalanceWarning: React.FC = () => {
  return (
    <div className="mb-4 p-2 rounded-md bg-red-50 border border-red-100 text-sm text-[#ea384c]">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-medium">Negative TOIL balance</span>
      </div>
      <p className="ml-6 text-xs mt-1">
        You've used more TOIL hours than you've earned this month.
      </p>
    </div>
  );
};

export default TOILNegativeBalanceWarning;
