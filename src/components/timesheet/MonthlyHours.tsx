
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TimeEntry, User, WorkSchedule } from "@/types";
import { getWorkdaysInMonth } from "@/utils/time/scheduleUtils";
import { useMonthlyHoursCalculation } from "./hooks/useMonthlyHoursCalculation";
import { useUserMetrics } from "@/contexts/user-metrics";

interface MonthlyHoursProps {
  entries: TimeEntry[];
  user?: User;
  currentMonth: Date;
  workSchedule?: WorkSchedule;
}

const MonthlyHours: React.FC<MonthlyHoursProps> = ({ entries, user, currentMonth, workSchedule }) => {
  const { getUserMetrics } = useUserMetrics();
  const {
    hours,
    targetHours,
    percentage,
    hoursRemaining,
    progressColor
  } = useMonthlyHoursCalculation(entries, currentMonth, user, workSchedule);

  // Get user metrics to display FTE information
  const userMetrics = user ? getUserMetrics(user.id) : null;

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-xl font-bold mb-4">Monthly Hours</h3>
        
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
          {hoursRemaining} hours remaining to meet target
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

export default MonthlyHours;
