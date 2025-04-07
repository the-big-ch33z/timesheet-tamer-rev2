
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

export interface ProgressProps extends 
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  color?: "default" | "success" | "warning" | "danger" | "info" | string;
  indicatorColor?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, color = "default", indicatorColor, ...props }, ref) => {
  // Determine the background color based on the color prop
  const getBgColor = () => {
    switch (color) {
      case "success":
        return "bg-green-100";
      case "warning":
        return "bg-amber-100";
      case "danger":
        return "bg-red-100";
      case "info":
        return "bg-blue-100";
      default:
        return "bg-primary/20";
    }
  };

  // Determine the indicator color based on the color prop or custom indicatorColor
  const getIndicatorColor = () => {
    if (indicatorColor) return indicatorColor;
    
    switch (color) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-amber-500";
      case "danger":
        return "bg-red-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-primary";
    }
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        getBgColor(),
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", getIndicatorColor())}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
