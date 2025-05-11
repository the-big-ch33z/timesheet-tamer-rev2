
import React from "react";
import { TOILDebugPanel } from "@/components/debug/TOILDebugPanel";
import { TOILDataValidator } from "@/components/debug/DataValidator";

interface DebugPanelProps {
  userId: string;
  date: Date;
  onCalculateTOIL: () => void;
  isCalculating: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  userId,
  date,
  onCalculateTOIL,
  isCalculating
}) => {
  return (
    <>
      <TOILDebugPanel 
        userId={userId} 
        date={date}
        onCalculateTOIL={onCalculateTOIL}
        isCalculating={isCalculating}
      />
      <TOILDataValidator userId={userId} />
    </>
  );
};

export default DebugPanel;
