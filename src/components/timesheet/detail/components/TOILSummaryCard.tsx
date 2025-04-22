import React, { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TOILSummary } from "@/types/toil";
import { formatDisplayHours } from "@/utils/time/formatting";
import { Clock, CircleMinus, CirclePlus, CircleCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

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
  const box = [
    {
      label: "Earned",
      value: accrued,
      color: "text-blue-600",
      border: "border-blue-100 bg-blue-50",
      icon: <CirclePlus className="w-5 h-5 text-blue-400" />
    },
    {
      label: "Used",
      value: used,
      color: "text-red-600",
      border: "border-red-100 bg-red-50",
      icon: <CircleMinus className="w-5 h-5 text-red-400" />
    },
    {
      label: "Remaining",
      value: remaining,
      color: "text-green-600",
      border: "border-green-100 bg-green-50",
      icon: <CircleCheck className="w-5 h-5 text-green-400" />
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {box.map(({ label, value, color, border, icon }) => (
        <div
          key={label}
          className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl border ${border} bg-white/80 shadow-sm 
            transition-transform group-hover:scale-105`}
        >
          {icon}
          <span className={`text-[0.95rem] font-semibold tracking-tight ${color}`}>{label}</span>
          <span className={`text-2xl font-extrabold leading-none ${color}`}>
            {formatDisplayHours(value)}
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
        </div>
      ))}
    </div>
  );
});

const TOILSummaryCard: React.FC<TOILSummaryCardProps> = memo(({
  summary,
  loading = false,
  monthName
}) => {
  const accrued = summary?.accrued ?? 0;
  const used = summary?.used ?? 0;
  const remaining = summary?.remaining ?? 0;
  const total = Math.max(accrued + used, 1);

  const hasNoTOILActivity = accrued === 0 && used === 0 && remaining === 0 && !loading;

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
          </div>
        ) : (
          <>
            <TOILSummaryBoxes accrued={accrued} used={used} remaining={remaining} />
            
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-600 px-2">
              <span>Balance</span>
              <span className="font-bold tracking-tight">{formatDisplayHours(remaining)}</span>
            </div>
            <Progress
              value={total === 0 ? 0 : Math.max(0, Math.min(100, 100 * remaining / (accrued || 1)))}
              color="success"
              className="h-2 bg-green-100/60"
              indicatorColor="bg-green-500"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default memo(TOILSummaryCard);
