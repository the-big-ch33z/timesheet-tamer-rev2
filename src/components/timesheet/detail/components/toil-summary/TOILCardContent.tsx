
import React from "react";
import { TOILSummary } from "@/types/toil";
import TOILLoadingState from "./TOILLoadingState";
import TOILNegativeBalanceWarning from "./TOILNegativeBalanceWarning";
import TOILProgressBar from "./TOILProgressBar";
import TOILSummaryBoxes from "./TOILSummaryBoxes";
import TOILRolloverDisplay from "./TOILRolloverDisplay";
import UnifiedTOILSummary from "@/components/toil/TOILSummary";

interface TOILCardContentProps {
  summary: TOILSummary | null;
  loading: boolean;
  useSimpleView: boolean;
  showRollover: boolean;
  rolloverHours: number;
  onError?: (error: string) => void;
}

const TOILCardContent: React.FC<TOILCardContentProps> = ({
  summary,
  loading,
  useSimpleView,
  showRollover,
  rolloverHours,
  onError
}) => {
  if (loading) {
    return <TOILLoadingState />;
  }
  
  // Safely extract values with defaults of zero
  const accrued = summary?.accrued ?? 0;
  const used = summary?.used ?? 0;
  const remaining = summary?.remaining ?? 0;
  
  // Additional validation
  if (summary && (isNaN(accrued) || isNaN(used) || isNaN(remaining))) {
    if (onError) {
      onError('TOIL data contains invalid numeric values');
    }
  }

  const isNegativeBalance = remaining < 0;
  
  if (useSimpleView) {
    return (
      <>
        <UnifiedTOILSummary 
          summary={summary} 
          showRollover={showRollover} 
          rolloverHours={rolloverHours}
          variant="simple"
        />
      </>
    );
  }

  return (
    <>
      <TOILSummaryBoxes 
        accrued={accrued} 
        used={used} 
        remaining={remaining} 
        onError={onError}
      />
      
      {isNegativeBalance && <TOILNegativeBalanceWarning />}
      
      <TOILProgressBar 
        remaining={remaining} 
        accrued={accrued} 
        isNegativeBalance={isNegativeBalance} 
      />
      
      <TOILRolloverDisplay 
        showRollover={showRollover} 
        rolloverHours={rolloverHours} 
      />
    </>
  );
};

export default TOILCardContent;
