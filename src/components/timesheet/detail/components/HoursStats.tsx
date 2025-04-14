
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';

interface HoursStatsProps {
  totalHours: number;
  remainingHours: number;
  overHours: number;
}

const HoursStats: React.FC<HoursStatsProps> = ({ 
  totalHours, 
  remainingHours, 
  overHours 
}) => {
  // Calculate percentage of hours completed
  const percentage = Math.min(100, (totalHours / (totalHours + remainingHours)) * 100);
  
  // Determine color based on status (under, met, or over)
  const getStatusColor = () => {
    if (overHours > 0) return "bg-green-500";
    if (percentage >= 95) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  // Format hours for display with decimal precision
  const formatHours = (hours: number): string => {
    return hours.toFixed(1);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">Daily Hours Progress</span>
        <span className="text-sm font-bold">
          {formatHours(totalHours)} / {formatHours(totalHours + remainingHours)}
        </span>
      </div>
      
      <Progress
        value={percentage}
        className="h-2 mb-1"
        indicatorClassName={getStatusColor()}
      />
      
      <div className="flex justify-between text-xs text-gray-500">
        {overHours > 0 ? (
          <span className="text-green-600 font-medium">
            Target met (+{formatHours(overHours)} hours)
          </span>
        ) : remainingHours > 0 ? (
          <span>
            {formatHours(remainingHours)} hours remaining
          </span>
        ) : (
          <span className="text-green-600 font-medium">
            Target met!
          </span>
        )}
        <span>{percentage.toFixed(0)}% complete</span>
      </div>
    </div>
  );
};

export default HoursStats;
