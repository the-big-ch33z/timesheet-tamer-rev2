
import React from 'react';
import { cn } from '@/lib/utils';

interface VerticalProgressBarProps {
  value: number;
  height?: number;
  width?: number;
  barColor?: string;
  bgColor?: string;
  className?: string;
}

export const VerticalProgressBar: React.FC<VerticalProgressBarProps> = ({
  value,
  height = 100,
  width = 12,
  barColor = 'bg-blue-500',
  bgColor = 'bg-gray-200',
  className,
}) => {
  // Ensure value is between 0 and 100
  const safeValue = Math.min(100, Math.max(0, value));

  // Calculate the height of the progress indicator
  const indicatorHeight = (safeValue * height) / 100;

  return (
    <div 
      className={cn("relative rounded-full overflow-hidden", bgColor, className)}
      style={{ height: `${height}px`, width: `${width}px` }}
    >
      <div
        className={cn("absolute bottom-0 w-full transition-all duration-300", barColor)}
        style={{ height: `${indicatorHeight}px` }}
      />
    </div>
  );
};
