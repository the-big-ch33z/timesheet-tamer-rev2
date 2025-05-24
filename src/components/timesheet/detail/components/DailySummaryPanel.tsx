
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
  const progressPercentage = requiredHours > 0 ? Math.min(100, submittedHours / requiredHours * 100) : 0;

  // Determine color based on progress
  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'bg-green-500';
    if (progressPercentage >= 75) return 'bg-blue-500';
    if (progressPercentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  const isComplete = progressPercentage >= 100;
  
  return <div className="bg-white rounded-lg h-full">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-medium py-[12px] px-[99px]">Daily Summary</h3>
        
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Left content - Hours information */}
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-0.5 px-[59px]">Hours Progress</h4>
            <p className="text-base font-semibold px-[62px]">
              {roundedSubmitted} <span className="text-gray-400">/</span> {roundedRequired} hours
            </p>
            <p className="text-xs text-gray-500 px-[54px]">
              {remainingHours > 0 ? `${remainingHours} hours remaining` : "All hours submitted"}
            </p>
          </div>
        </div>
        
        {/* Right content - Progress bar and completion */}
        <div className="flex flex-col items-center space-y-1 px-0 py-0 my-[35px]">
          <VerticalProgressBar value={progressPercentage} height={50} width={12} barColor={getProgressColor()} />
          
          <div className="text-center">
            <p className="text-xs font-medium text-gray-700">Completion</p>
            <p className="text-base font-semibold flex items-center px-[27px]">
              {Math.round(progressPercentage)}%
              {progressPercentage >= 100 && <span className="ml-1 text-green-500 text-xs">✓</span>}
            </p>
          </div>
        </div>
      </div>
      
      {/* Completion message below progress bar */}
      {isComplete && (
        <div className="mt-2 p-2 rounded-md bg-green-50 border border-green-100 text-green-700 flex items-center text-xs">
          <span className="mr-2">✓</span>
          <span>This day has been completed with all scheduled hours accounted for.</span>
        </div>
      )}
    </div>;
};
export default DailySummaryPanel;
