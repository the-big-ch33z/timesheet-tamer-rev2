
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TimeEntry, User } from "@/types";
import { getWorkdaysInMonth } from "@/lib/date-utils";
import { useMonthlyHoursCalculation } from "./hooks/useMonthlyHoursCalculation";

interface MonthlyHoursProps {
  entries: TimeEntry[];
  user?: User;
  currentMonth: Date;
}

const MonthlyHours: React.FC<MonthlyHoursProps> = ({ entries, user, currentMonth }) => {
  const {
    hours,
    targetHours,
    percentage,
    hoursRemaining,
    progressColor
  } = useMonthlyHoursCalculation(entries, user, currentMonth);

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
      </CardContent>
    </Card>
  );
};

export default MonthlyHours;
