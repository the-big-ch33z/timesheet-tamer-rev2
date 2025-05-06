
import React, { memo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TOILSummary } from "@/types/toil";
import { formatDisplayHours } from "@/utils/time/formatting";
import { Clock, CircleMinus, CirclePlus, CircleCheck, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TOILSummaryCardProps {
  summary: TOILSummary | null;
  loading?: boolean;
  monthName?: string;
}

const TOILSummaryBoxes = memo(({
  accrued,
  used,
  remaining
}: {
  accrued: number;
  used: number;
  remaining: number;
}) => {
  // Guard against invalid inputs
  const safeAccrued = isFinite(accrued) ? accrued : 0;
  const safeUsed = isFinite(used) ? used : 0;
  const safeRemaining = isFinite(remaining) ? remaining : 0;
  const isNegativeBalance = safeRemaining < 0;

  console.log('TOILSummaryBoxes rendering with values:', { safeAccrued, safeUsed, safeRemaining, isNegativeBalance });
  
  const box = [{
    label: "Earned",
    value: safeAccrued,
    color: "text-blue-600",
    border: "border-blue-100 bg-blue-50",
    icon: <CirclePlus className="w-5 h-5 text-blue-400" />,
    displaySign: true
  }, {
    label: "Used",
    value: safeUsed,
    color: "text-red-600",
    border: "border-red-100 bg-red-50",
    icon: <CircleMinus className="w-5 h-5 text-red-400" />,
    displaySign: false,
    forceNegative: true
  }, {
    label: "Remaining",
    value: safeRemaining,
    color: isNegativeBalance ? "text-[#ea384c]" : "text-green-600",
    border: isNegativeBalance ? "border-red-100 bg-red-50" : "border-green-100 bg-green-50",
    icon: isNegativeBalance ? <AlertTriangle className="w-4 h-4 text-[#ea384c]" /> : <CircleCheck className="w-5 h-5 text-green-400" />,
    displaySign: true
  }];
  
  return <div className="grid grid-cols-3 gap-3 mb-6">
      {box.map(({
      label,
      value,
      color,
      border,
      icon,
      displaySign,
      forceNegative
    }) => {
      let formattedValue;
      try {
        if (forceNegative) {
          formattedValue = `-${formatDisplayHours(Math.abs(value)).replace(/^[+-]/, '')}`;
        } else if (displaySign) {
          formattedValue = formatDisplayHours(value);
        } else {
          formattedValue = formatDisplayHours(Math.abs(value)).replace(/^[+-]/, '');
        }
      } catch (e) {
        console.error(`Error formatting value for ${label}`, e);
        formattedValue = "0h";
      }
      return <div key={label} className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl border ${border} bg-white/80 shadow-sm 
              transition-transform group-hover:scale-105`}>
            {icon}
            <span className={`text-[0.95rem] font-semibold tracking-tight ${color}`}>{label}</span>
            <span className={`text-2xl font-extrabold leading-none ${color}`}>
              {formattedValue}
            </span>
            <span className="text-xs text-gray-500 font-medium">hours</span>

            {label === "Earned" && <TooltipProvider>
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
              </TooltipProvider>}

            {label === "Remaining" && isNegativeBalance && <div className="mt-1 text-xs text-[#ea384c] font-medium animate-pulse">
                Negative balance
              </div>}
          </div>;
    })}
    </div>;
});

const TOILSummaryCard: React.FC<TOILSummaryCardProps> = memo(({
  summary,
  loading = false,
  monthName
}) => {
  try {
    console.log('TOILSummaryCard received summary:', summary, 'loading:', loading);
    
    // Safety checks for null or invalid summary
    if (!summary && !loading) {
      console.warn('TOILSummaryCard received null summary and not in loading state');
    }
    
    const accrued = summary?.accrued ?? 0;
    const used = summary?.used ?? 0;
    const remaining = summary?.remaining ?? 0;
    
    // Additional validation
    if (summary && (isNaN(accrued) || isNaN(used) || isNaN(remaining))) {
      console.error('TOILSummaryCard received invalid numeric values:', { accrued, used, remaining });
    }
    
    const total = Math.max(accrued + Math.abs(used), 1); // Prevent division by zero
    const isNegativeBalance = remaining < 0;
    const hasNoTOILActivity = loading;
    const progressColor = isNegativeBalance ? "bg-[#ea384c]" : "bg-green-500";
    const progressBgColor = isNegativeBalance ? "bg-red-100/60" : "bg-green-100/60";
    
    return <Card className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-lg border-0 rounded-2xl transition-shadow hover:shadow-xl group" style={{
      minWidth: 300
    }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-blue-700 tracking-tight flex items-center gap-2 mb-2">
            <Clock className="w-6 h-6 text-blue-400" />
            TOIL Summary {monthName}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                {[1, 2, 3].map(key => <div key={key} className="flex-1 rounded-lg border bg-blue-100/40 border-blue-100 px-4 py-3 animate-pulse">
                    <div className="h-4 w-6 mb-3 rounded bg-blue-200/60"></div>
                    <div className="h-6 w-14 mb-2 rounded bg-blue-200/60"></div>
                    <div className="h-3 w-10 rounded bg-blue-100"></div>
                  </div>)}
              </div>
              <div className="h-3 rounded bg-blue-100/70 mt-4 animate-pulse w-full"></div>
            </div> : hasNoTOILActivity ? <div className="flex flex-col items-center justify-center py-7 text-blue-500 opacity-70">
              <CircleCheck className="w-10 h-10 mb-2 opacity-80" />
              <p className="text-center text-base font-medium">No TOIL activity for this month.</p>
              <span className="text-sm text-blue-500/70 mt-1">Earn TOIL by working overtime. Log TOIL time off as "TOIL".</span>
            </div> : <>
              <TOILSummaryBoxes accrued={accrued} used={used} remaining={remaining} />

              {isNegativeBalance && <div className="mb-4 p-2 rounded-md bg-red-50 border border-red-100 text-sm text-[#ea384c]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Negative TOIL balance</span>
                  </div>
                  <p className="ml-6 text-xs mt-1">
                    You've used more TOIL hours than you've earned this month.
                  </p>
                </div>}

              <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-600 px-2">
                <span>Balance</span>
                <span className={`font-bold tracking-tight ${isNegativeBalance ? "text-[#ea384c]" : ""}`}>
                  {isNegativeBalance ? "-" : "+"}{formatDisplayHours(Math.abs(remaining)).replace(/^[+-]/, '')}
                </span>
              </div>
              <Progress value={total === 0 ? 0 : Math.max(0, Math.min(100, 100 * Math.abs(remaining) / (accrued || 1)))} color={isNegativeBalance ? "destructive" : "success"} className={`h-2 ${progressBgColor}`} indicatorColor={progressColor} />
            </>}
        </CardContent>
      </Card>;
  } catch (err) {
    console.error("TOILSummaryCard crashed while rendering:", err);
    return <div className="text-red-600 p-4 border border-red-300 rounded-md">
      <div className="font-bold mb-2">Error displaying TOIL summary</div>
      <div className="text-sm">{String(err)}</div>
    </div>;
  }
});

export default memo(TOILSummaryCard);
