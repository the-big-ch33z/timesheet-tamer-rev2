
import React, { memo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TOILSummary } from "@/types/toil";
import { formatDisplayHours } from "@/utils/time/formatting";
import { Clock, CircleMinus, CirclePlus, CircleCheck, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TOILSummaryCard');

interface TOILSummaryCardProps {
  summary: TOILSummary | null;
  loading?: boolean;
  monthName?: string;
}

const TOILSummaryBoxes = memo(({ accrued, used, remaining }: { 
  accrued: number;
  used: number;
  remaining: number;
}) => {
  // Log the values we're rendering
  logger.debug(`TOILSummaryBoxes rendering with: accrued=${accrued}, used=${used}, remaining=${remaining}`);
  
  // Ensure we always have valid numbers
  const safeAccrued = isFinite(accrued) ? accrued : 0;
  const safeUsed = isFinite(used) ? used : 0;
  const safeRemaining = isFinite(remaining) ? remaining : 0;
  
  // Check if we have a negative balance
  const isNegativeBalance = safeRemaining < 0;

  const box = [
    {
      label: "Earned",
      value: safeAccrued,
      color: "text-blue-600",
      border: "border-blue-100 bg-blue-50",
      icon: <CirclePlus className="w-5 h-5 text-blue-400" />,
      displaySign: true
    },
    {
      label: "Used",
      value: safeUsed,
      color: "text-red-600",
      border: "border-red-100 bg-red-50",
      icon: <CircleMinus className="w-5 h-5 text-red-400" />,
      displaySign: false,
      forceNegative: true // Always show as negative
    },
    {
      label: "Remaining",
      value: safeRemaining,
      color: isNegativeBalance ? "text-[#ea384c]" : "text-green-600",
      border: isNegativeBalance ? "border-red-100 bg-red-50" : "border-green-100 bg-green-50",
      icon: isNegativeBalance ? 
        <AlertTriangle className="w-4 h-4 text-[#ea384c]" /> : 
        <CircleCheck className="w-5 h-5 text-green-400" />,
      displaySign: true
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {box.map(({ label, value, color, border, icon, displaySign, forceNegative }) => {
        let formattedValue;
        
        if (forceNegative) {
          // For "Used", always show as negative
          formattedValue = `-${formatDisplayHours(Math.abs(value)).replace(/^[+-]/, '')}`;
        } else if (displaySign) {
          // For "Earned" and "Remaining", show actual sign
          formattedValue = formatDisplayHours(value);
        } else {
          // For cases where we don't want a sign
          formattedValue = formatDisplayHours(Math.abs(value)).replace(/^[+-]/, '');
        }
        
        logger.debug(`TOILSummaryBoxes formatting ${label}: ${value} -> ${formattedValue}`);
        
        return (
          <div
            key={label}
            className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl border ${border} bg-white/80 shadow-sm 
              transition-transform group-hover:scale-105`}
          >
            {icon}
            <span className={`text-[0.95rem] font-semibold tracking-tight ${color}`}>{label}</span>
            <span className={`text-2xl font-extrabold leading-none ${color}`}>
              {formattedValue}
            </span>
            <span className="text-xs text-gray-500 font-medium">hours</span>
            
            {label === "Earned" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-gray-500 mt-1 cursor-help">
                      Click for details
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
            )}
            
            {label === "Remaining" && isNegativeBalance && (
              <div className="mt-1 text-xs text-[#ea384c] font-medium animate-pulse">
                Negative balance
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

const TOILSummaryCard: React.FC<TOILSummaryCardProps> = memo(({
  summary,
  loading = false,
  monthName
}) => {
  // Enhanced debugging to help identify issues with summary data
  useEffect(() => {
    logger.debug('TOILSummaryCard received summary:', summary, 'loading:', loading);
    
    if (summary) {
      logger.debug(`TOIL values: accrued=${summary.accrued}, used=${summary.used}, remaining=${summary.remaining}`);
    } else {
      logger.debug('No TOIL summary data available');
    }
  }, [summary, loading]);

  // Ensure we have valid and safe values to display
  const accrued = summary?.accrued ?? 0;
  const used = summary?.used ?? 0;
  const remaining = summary?.remaining ?? 0;
  
  // Prevent division by zero
  const total = Math.max(accrued + Math.abs(used), 1);
  
  // Check if there's a negative balance
  const isNegativeBalance = remaining < 0;

  // Check if there's no TOIL activity - always show the empty state if all values are zero
  const hasNoTOILActivity = accrued === 0 && used === 0 && remaining === 0 && !loading;
  
  // Define progress color based on remaining balance
  const progressColor = isNegativeBalance ? "bg-[#ea384c]" : "bg-green-500";
  const progressBgColor = isNegativeBalance ? "bg-red-100/60" : "bg-green-100/60";

  return (
    <Card
      className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-lg border-0 rounded-2xl transition-shadow hover:shadow-xl group"
      style={{
        minWidth: 300
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-blue-700 tracking-tight flex items-center gap-2 mb-2">
          <Clock className="w-6 h-6 text-blue-400" />
          TOIL Summary {monthName && <span className="text-blue-400 ml-1 text-base">({monthName})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              {[1,2,3].map(key =>
                <div key={key} className="flex-1 rounded-lg border bg-blue-100/40 border-blue-100 px-4 py-3 animate-pulse">
                  <div className="h-4 w-6 mb-3 rounded bg-blue-200/60"></div>
                  <div className="h-6 w-14 mb-2 rounded bg-blue-200/60"></div>
                  <div className="h-3 w-10 rounded bg-blue-100"></div>
                </div>
              )}
            </div>
            <div className="h-3 rounded bg-blue-100/70 mt-4 animate-pulse w-full"></div>
          </div>
        ) : hasNoTOILActivity ? (
          <div className="flex flex-col items-center justify-center py-7 text-blue-500 opacity-70">
            <CircleCheck className="w-10 h-10 mb-2 opacity-80" />
            <p className="text-center text-base font-medium">No TOIL activity for this month.</p>
            <span className="text-sm text-blue-500/70 mt-1">Earn TOIL by working overtime. Log TOIL time off as "TOIL".</span>
            
            <div className="mt-4 text-xs text-gray-500 p-2 bg-blue-50/70 rounded-md">
              <div className="font-medium">Debug Info:</div>
              <div>User has no TOIL records for this month.</div>
              <div>Summary data: {JSON.stringify({accrued, used, remaining})}</div>
            </div>
          </div>
        ) : (
          <>
            <TOILSummaryBoxes accrued={accrued} used={used} remaining={remaining} />
            
            {isNegativeBalance && (
              <div className="mb-4 p-2 rounded-md bg-red-50 border border-red-100 text-sm text-[#ea384c]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Negative TOIL balance</span>
                </div>
                <p className="ml-6 text-xs mt-1">
                  You've used more TOIL hours than you've earned this month.
                </p>
              </div>
            )}
            
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-600 px-2">
              <span>Balance</span>
              <span className={`font-bold tracking-tight ${isNegativeBalance ? "text-[#ea384c]" : ""}`}>
                {isNegativeBalance ? "-" : "+"}{formatDisplayHours(Math.abs(remaining)).replace(/^[+-]/, '')}
              </span>
            </div>
            <Progress
              value={total === 0 ? 0 : Math.max(0, Math.min(100, 100 * Math.abs(remaining) / (accrued || 1)))}
              color={isNegativeBalance ? "destructive" : "success"}
              className={`h-2 ${progressBgColor}`}
              indicatorColor={progressColor}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default memo(TOILSummaryCard);
