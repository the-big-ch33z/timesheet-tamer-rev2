
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TimeEntry, User } from "@/types";
import { getDaysInMonth, getWorkdaysInMonth } from "@/lib/date-utils";

interface MonthlyHoursProps {
  entries: TimeEntry[];
  user?: User;
  currentMonth: Date;
}

const MonthlyHours: React.FC<MonthlyHoursProps> = ({ entries, user, currentMonth }) => {
  // Calculate total hours logged for the month
  const hours = entries.reduce((total, entry) => total + entry.hours, 0);
  
  // Calculate target hours based on user's fortnightHours setting
  const calculateTargetHours = () => {
    // Default to 76 hours per fortnight if not set
    const fortnightHours = user?.fortnightHours || 76;
    
    // Get number of workdays in the month
    const workDaysInMonth = getWorkdaysInMonth(currentMonth);
    
    // Standard workdays in a fortnight (10 days in 2 weeks)
    const fortnightWorkDays = 10;
    
    // Calculate the target hours proportionally
    const targetHours = (workDaysInMonth / fortnightWorkDays) * fortnightHours;
    
    // Round to 1 decimal place
    return Math.round(targetHours * 10) / 10;
  };
  
  const targetHours = calculateTargetHours();
  const percentage = Math.min(Math.round((hours / targetHours) * 100), 100);
  
  // Determine color based on percentage
  const getProgressColor = () => {
    if (percentage >= 100) return "success";
    if (percentage >= 70) return "info";
    if (percentage >= 30) return "warning";
    return "danger";
  };

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
          color={getProgressColor()}
        />
        
        <div className="text-sm text-gray-500">
          {targetHours - hours > 0 ? (targetHours - hours).toFixed(1) : 0} hours remaining to meet target
        </div>
        <div className="text-sm text-gray-500">
          Based on {getWorkdaysInMonth(currentMonth)} work days this month
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyHours;
