
import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User, WorkSchedule } from "@/types";
import { getWorkdaysInMonth } from "@/utils/time/scheduleUtils";
import { useMonthlyHoursCalculation } from "./hooks/useMonthlyHoursCalculation";
import { useUserMetrics } from "@/contexts/user-metrics";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/TimeEntryContext";
import { format } from "date-fns";

interface MonthlyHoursProps {
  user?: User;
  currentMonth: Date;
  workSchedule?: WorkSchedule;
}

const MonthlyHours: React.FC<MonthlyHoursProps> = ({ user, currentMonth, workSchedule }) => {
  const { getUserMetrics } = useUserMetrics();
  const { entries, getMonthEntries } = useTimeEntryContext(); 
  
  // Get all entries for this month
  const monthEntries = useMemo(() => {
    if (!user?.id) return [];
    return getMonthEntries(currentMonth, user.id);
  }, [getMonthEntries, user, currentMonth]);
  
  // Call hook at the top level with month entries
  const calculation = useMonthlyHoursCalculation(monthEntries, currentMonth, user, workSchedule);
  
  // Memoize derived values
  const {
    hours,
    targetHours,
    percentage,
    hoursRemaining,
    progressColor
  } = useMemo(() => ({
    ...calculation
  }), [calculation]);

  // Get user metrics for FTE information
  const userMetrics = user ? getUserMetrics(user.id) : null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold">Monthly Hours</h3>
          <div className="text-sm text-gray-500">{format(currentMonth, 'MMMM yyyy')}</div>
        </div>
        
        <div className="text-4xl font-bold mb-1">
          {hours.toFixed(1)} <span className="text-lg text-gray-500">/ {targetHours} hrs</span>
        </div>
        
        <div className="text-right mb-2">{percentage}%</div>
        
        <Progress 
          value={percentage} 
          className="h-2 mb-4"
          color={progressColor}
        />
        
        <div className="text-sm text-gray-500">
          {hoursRemaining > 0 ? 
            `${hoursRemaining} hours remaining to meet target` :
            "Target hours met for this month"
          }
        </div>
        <div className="text-sm text-gray-500">
          Based on {getWorkdaysInMonth(currentMonth)} work days this month
        </div>
        
        {userMetrics && (
          <div className="mt-2 text-xs text-gray-400 border-t pt-2">
            FTE: {userMetrics.fte} · Required hours/fortnight: {userMetrics.fortnightHours}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(MonthlyHours);
