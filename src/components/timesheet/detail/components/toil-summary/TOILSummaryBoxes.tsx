
import React, { useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import TOILSummaryBox from "./TOILSummaryBox";

interface TOILSummaryBoxesProps {
  accrued: number;
  used: number;
  remaining: number;
  onError?: (error: string) => void;
}

const TOILSummaryBoxes: React.FC<TOILSummaryBoxesProps> = ({
  accrued,
  used,
  remaining,
  onError
}) => {
  // Guard against invalid inputs with better error handling
  const hasInvalidValues = [accrued, used, remaining].some(val => !isFinite(val));
  
  useEffect(() => {
    if (hasInvalidValues && onError) {
      onError("Invalid TOIL values detected");
    }
  }, [hasInvalidValues, onError]);

  // Safe values with explicit fallbacks
  const safeAccrued = isFinite(accrued) ? accrued : 0;
  const safeUsed = isFinite(used) ? used : 0;
  const safeRemaining = isFinite(remaining) ? remaining : 0;
  const isNegativeBalance = safeRemaining < 0;

  console.log('TOILSummaryBoxes rendering with values:', { 
    safeAccrued, 
    safeUsed, 
    safeRemaining, 
    isNegativeBalance,
    hasInvalidValues 
  });
  
  const boxConfigs = [
    {
      label: "Earned",
      value: safeAccrued,
      color: "text-blue-600",
      border: "border-blue-100 bg-blue-50",
      icon: <span className="text-blue-400">+</span>,
      displaySign: true,
      showTooltip: true
    }, 
    {
      label: "Used",
      value: safeUsed,
      color: "text-red-600",
      border: "border-red-100 bg-red-50",
      icon: <span className="text-red-400">-</span>,
      displaySign: false,
      forceNegative: true
    }, 
    {
      label: "Remaining",
      value: safeRemaining,
      color: isNegativeBalance ? "text-[#ea384c]" : "text-green-600",
      border: isNegativeBalance ? "border-red-100 bg-red-50" : "border-green-100 bg-green-50",
      icon: isNegativeBalance ? <span className="text-[#ea384c]">!</span> : <span className="text-green-400">✓</span>,
      displaySign: true,
      isNegativeBalance
    }
  ];
  
  return (
    <>
      {hasInvalidValues && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Some TOIL values couldn't be calculated properly.</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {boxConfigs.map((boxConfig) => (
          <React.Fragment key={boxConfig.label}>
            {boxConfig.label === "Earned" && boxConfig.showTooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="contents">
                      <TOILSummaryBox {...boxConfig} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p>TOIL is earned by working:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>On RDOs</li>
                        <li>On weekends</li>
                        <li>On public holidays</li>
                        <li>Over scheduled hours</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TOILSummaryBox {...boxConfig} />
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default TOILSummaryBoxes;
