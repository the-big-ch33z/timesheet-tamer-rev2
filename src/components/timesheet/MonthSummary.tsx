import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { User, WorkSchedule } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { formatDisplayHours } from "@/utils/time/formatting";
import { Progress } from "@/components/ui/progress";
import { CirclePercent } from "lucide-react";
import { useScheduleCalculation } from "@/hooks/timesheet/useScheduleCalculation";
import { calculateMonthlyTargetHours } from "@/utils/time/calculations/hoursCalculations";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('MonthSummary');

interface MonthSummaryProps {
  userId: string;
  date: Date;
  workSchedule?: WorkSchedule;
}

const MonthSummary: React.FC<MonthSummaryProps> = ({
  userId,
  date,
  workSchedule
}) => {
  const [monthTotalHours, setMonthTotalHours] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const { getMonthEntries, calculateTotalHours } = useTimeEntryContext();
  const { fortnightHours } = useScheduleCalculation(workSchedule);

  // Calculate monthly target hours considering RDOs
  const monthlyTarget = useMemo(() => {
    const target = calculateMonthlyTargetHours(fortnightHours, date, workSchedule);
    logger.debug(`Calculated monthly target: ${target} hours from fortnight hours: ${fortnightHours}`);
    return target;
  }, [fortnightHours, date, workSchedule]);

  useEffect(() => {
    setIsLoading(true);
    const monthEntries = getMonthEntries(date, userId);
    const totalHours = calculateTotalHours(monthEntries);
    
    logger.debug(`Month total hours: ${totalHours} from ${monthEntries.length} entries`);
    setMonthTotalHours(totalHours);
    setIsLoading(false);
  }, [date, userId, getMonthEntries, calculateTotalHours]);

  const percent = monthlyTarget > 0 ? Math.min(100, Math.round((monthTotalHours / monthlyTarget) * 100)) : 0;
  const hoursRemaining = monthlyTarget - monthTotalHours;

  return (
    <div className="space-y-0">
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <div className="h-7 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="h-5 bg-gray-100 rounded w-2/3 animate-pulse"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 border border-blue-200 p-4">
              <CirclePercent className="w-7 h-7 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Monthly Hours</h3>
          </div>
          <div className="flex items-baseline gap-2 font-extrabold">
            <span className="text-3xl text-blue-900">{monthTotalHours.toFixed(1)}</span>
            <span className="text-lg text-gray-500 font-semibold">/ {monthlyTarget.toFixed(1)} hrs</span>
            <span className="text-blue-500 font-bold ml-3">{percent}%</span>
          </div>
          <Progress
            value={percent}
            color={percent === 100 ? "success" : "default"}
            className={`mt-3 h-2 ${percent === 100 ? "bg-green-100" : "bg-blue-100"}`}
            indicatorColor={percent === 100 ? "bg-green-500" : "bg-blue-500"}
          />
          <div className="mt-3 text-sm text-gray-600">
            {hoursRemaining > 0
              ? (
                <>
                  <span className="font-medium text-blue-700">{hoursRemaining.toFixed(1)} hours</span> remaining to meet target
                </>
              )
              : (
                <span className="font-medium text-green-600">Target met!</span>
              )
            }
          </div>
          <div className="text-xs font-medium text-gray-400 mt-1">
            Based on {workdaysInMonth.toFixed(1)} work days this month
          </div>
        </>
      )}
    </div>
  );
};

export default MonthSummary;
