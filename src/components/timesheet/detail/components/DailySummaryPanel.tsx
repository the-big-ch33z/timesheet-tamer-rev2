
import React from 'react';
import { VerticalProgressBar } from '@/components/ui/VerticalProgressBar';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('DailySummaryPanel');

interface DailySummaryPanelProps {
  requiredHours: number;
  submittedHours: number;
  date: Date;
}

const DailySummaryPanel: React.FC<DailySummaryPanelProps> = ({
  requiredHours,
  submittedHours,
  date
}) => {
  // Calculate values for display
  const roundedRequired = Math.round(requiredHours * 100) / 100;
  const roundedSubmitted = Math.round(submittedHours * 100) / 100;
  const remainingHours = Math.max(0, roundedRequired - roundedSubmitted);
  
  // Calculate progress percentage (capped at 100%)
  const progressPercentage = requiredHours > 0 
    ? Math.min(100, (submittedHours / requiredHours) * 100) 
    : 0;
  
  // Determine color based on progress
  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'bg-green-500';
    if (progressPercentage >= 75) return 'bg-blue-500';
    if (progressPercentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <h3 className="text-lg font-medium mb-4">Daily Summary</h3>
      <p className="text-sm text-gray-500 mb-4">{format(date, 'EEEE, MMMM d, yyyy')}</p>
      
      <div className="flex items-center">
        <div className="flex-1 space-y-6">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-gray-700">Hours Progress</h4>
            <p className="text-lg font-semibold">
              {roundedSubmitted} <span className="text-gray-400">/</span> {roundedRequired} hours submitted
            </p>
            <p className="text-sm text-gray-500">
              {remainingHours > 0 
                ? `${remainingHours} hours remaining` 
                : "All hours submitted"}
            </p>
          </div>
          
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-gray-700">Completion</h4>
            <p className="text-lg font-semibold">
              {Math.round(progressPercentage)}%
              {progressPercentage >= 100 && (
                <span className="ml-2 text-green-500 text-sm">✓ Complete</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="ml-4 flex items-center justify-center">
          <VerticalProgressBar 
            value={progressPercentage} 
            height={120}
            width={16}
            barColor={getProgressColor()}
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default DailySummaryPanel;
