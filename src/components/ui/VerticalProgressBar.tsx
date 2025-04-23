
import * as React from "react";
import { cn } from "@/lib/utils";

interface VerticalProgressBarProps {
  value: number; // 0–100
  height?: number; // px
  width?: number; // px
  barColor?: string;
  bgColor?: string;
  className?: string;
}

export const VerticalProgressBar: React.FC<VerticalProgressBarProps> = ({
  value,
  height = 64,
  width = 10,
  barColor = "bg-blue-500",
  bgColor = "bg-blue-100",
  className = "",
}) => (
  <div
    className={cn("flex flex-col items-center justify-end", className)}
    style={{ height, width, minWidth: width }}
    aria-label="progress"
  >
    <div
      className={`w-full relative rounded-full overflow-hidden ${bgColor}`}
      style={{ height: "100%" }}
    >
      <div
        className={`${barColor} absolute left-0 bottom-0 w-full transition-all rounded-full`}
        style={{
          height: `${Math.max(0, Math.min(100, value))}%`,
        }}
      />
    </div>
  </div>
);

export default VerticalProgressBar;
