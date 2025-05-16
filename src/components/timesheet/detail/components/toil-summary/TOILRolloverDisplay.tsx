
import React from "react";

interface TOILRolloverDisplayProps {
  showRollover: boolean;
  rolloverHours: number;
}

const TOILRolloverDisplay: React.FC<TOILRolloverDisplayProps> = ({ 
  showRollover, 
  rolloverHours 
}) => {
  if (!showRollover || rolloverHours <= 0) {
    return null;
  }
  
  return (
    <div className="mt-4 p-3 bg-muted/50 rounded-md">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Roll-over TOIL</span>
        <span className="font-semibold text-green-600">{rolloverHours.toFixed(1)} hours</span>
      </div>
      <p className="text-xs mt-1 text-muted-foreground">
        These hours have been rolled over and will be used first when taking TOIL.
      </p>
    </div>
  );
};

export default TOILRolloverDisplay;
