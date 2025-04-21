
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertTriangle } from "lucide-react";
import { TimeEntryStats } from "@/hooks/timesheet/useTimeEntryStats";
interface HoursStatsProps extends TimeEntryStats {
  calculatedHours: number;
}
const HoursStats: React.FC<HoursStatsProps> = ({
  calculatedHours,
  totalHours,
  hasEntries,
  hoursVariance,
  isUndertime
}) => {
  // Calculate percent complete
  const percentComplete = calculatedHours > 0 ? Math.min(Math.round(totalHours / calculatedHours * 100), 100) : 0;

  // Determine status color based on variance
  const getStatusColor = () => {
    if (!hasEntries) return "bg-gray-200";
    if (hoursVariance === 0) return "bg-green-500";
    if (isUndertime) return "bg-amber-500";
    return "bg-blue-500"; // Over time
  };
  return <Card className="shadow-sm w-full">
      <CardContent className="p-4 py-0 px-[10px] rounded-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Hours Status</h3>
          <Badge variant="outline" className={`${hasEntries ? isUndertime ? "border-amber-200 bg-amber-50 text-amber-700" : hoursVariance === 0 ? "border-green-200 bg-green-50 text-green-700" : "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
            {!hasEntries ? <>No Entries</> : hoursVariance === 0 ? <><Check className="h-3 w-3 mr-1" /> Complete</> : isUndertime ? <><AlertTriangle className="h-3 w-3 mr-1" /> Under Time</> : <><Clock className="h-3 w-3 mr-1" /> Over Time</>}
          </Badge>
        </div>
        {/* Progress Bar */}
        <div className="mt-3 w-full">
          <Progress value={percentComplete} className="h-2 bg-gray-100 w-full" />
        </div>
        {/* Hours Summary */}
        <div className="flex justify-between text-sm mt-2">
          <div>
            <span className="font-medium">{totalHours.toFixed(1)}</span>
            <span className="text-gray-500"> / {calculatedHours.toFixed(1)} hours</span>
          </div>
          <div className={`font-medium ${!hasEntries ? "text-gray-400" : isUndertime ? "text-amber-600" : hoursVariance === 0 ? "text-green-600" : "text-blue-600"}`}>
            {hasEntries && (hoursVariance === 0 ? "Complete" : `${Math.abs(hoursVariance).toFixed(1)} hours ${isUndertime ? "under" : "over"}`)}
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default HoursStats;
