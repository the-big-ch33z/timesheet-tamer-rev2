
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const MonthlyHours: React.FC = () => {
  // For demo purposes
  const hours = 0.0;
  const targetHours = 159.6;
  const percentage = Math.round((hours / targetHours) * 100);
  
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
          {targetHours - hours} hours remaining to meet target
        </div>
        <div className="text-sm text-gray-500">
          Based on 19.9 work days this month
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyHours;
