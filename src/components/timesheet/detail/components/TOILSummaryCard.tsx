
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TOILSummary } from "@/types/toil";
import { formatDisplayHours } from "@/utils/time/formatting";
import { Hourglass, Clock, CheckCheck } from "lucide-react";

interface TOILSummaryCardProps {
  summary: TOILSummary | null;
  loading?: boolean;
  monthName?: string;
}

const TOILSummaryCard: React.FC<TOILSummaryCardProps> = ({ 
  summary, 
  loading = false,
  monthName
}) => {
  // Set default values if no summary or loading
  const accrued = summary?.accrued || 0;
  const used = summary?.used || 0;
  const remaining = summary?.remaining || 0;

  return (
    <Card className="shadow-sm bg-amber-50/50 border-amber-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-amber-800 flex items-center">
          <Hourglass className="h-5 w-5 mr-2" />
          TOIL Summary {monthName && `(${monthName})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-amber-100 rounded w-1/2"></div>
            <div className="h-6 bg-amber-100 rounded w-3/4"></div>
            <div className="h-6 bg-amber-100 rounded w-2/3"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-amber-700">
                <Clock className="h-4 w-4 mr-2" />
                TOIL Accrued
              </div>
              <div className="font-medium text-amber-900">{formatDisplayHours(accrued)}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-amber-700">
                <CheckCheck className="h-4 w-4 mr-2" />
                TOIL Used
              </div>
              <div className="font-medium text-amber-900">{formatDisplayHours(used)}</div>
            </div>
            <div className="flex justify-between items-center border-t border-amber-200 pt-2">
              <div className="flex items-center font-medium text-amber-800">
                TOIL Remaining
              </div>
              <div className="font-semibold text-lg text-amber-900">{formatDisplayHours(remaining)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TOILSummaryCard;
