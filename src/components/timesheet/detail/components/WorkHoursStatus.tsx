
import React from 'react';
import { VerticalProgressBar } from '@/components/ui/VerticalProgressBar';

interface WorkHoursStatusProps {
  effectiveTotalHours: number;
  scheduledHours: number;
  isOverScheduled: boolean;
  isActuallyComplete: boolean;
  isUndertime: boolean;
  isDaySick: boolean;
  isDayLeave: boolean;
  isDayToil: boolean;
}

export const WorkHoursStatus: React.FC<WorkHoursStatusProps> = ({
  effectiveTotalHours,
  scheduledHours,
  isOverScheduled,
  isActuallyComplete,
  isUndertime,
  isDaySick,
  isDayLeave,
  isDayToil
}) => {
  const verticalProgressValue = scheduledHours === 0 ? 0 : 
    Math.min(100, (effectiveTotalHours / scheduledHours) * 100);

  return (
    <div className="flex flex-col items-center justify-start min-h-[210px]">
      <VerticalProgressBar
        value={verticalProgressValue}
        height={90}
        width={13}
        barColor={
          isOverScheduled
            ? "bg-red-500"
            : isActuallyComplete
            ? "bg-green-500"
            : isUndertime
            ? "bg-amber-500"
            : isDaySick
            ? "bg-[#ea384c]"
            : isDayLeave
            ? "bg-sky-500"
            : isDayToil
            ? "bg-purple-500"
            : "bg-blue-500"
        }
        bgColor="bg-gray-100"
      />
      <span className="text-[0.70rem] mt-1 mx-auto text-gray-500 text-center font-medium">
        {verticalProgressValue.toFixed(0)}%
      </span>
    </div>
  );
};
