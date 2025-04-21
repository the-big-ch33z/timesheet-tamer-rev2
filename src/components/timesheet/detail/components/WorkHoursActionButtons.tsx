
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Palmtree, Utensils, Sick } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkHoursActionType = "sick" | "leave" | "toil" | "lunch";

const ACTIONS: {
  type: WorkHoursActionType,
  icon: React.ElementType,
  tooltip: string,
  color: string,
  activeBg: string,
}[] = [
  {
    type: "sick",
    icon: Sick,
    tooltip: "Mark as Sick Day",
    color: "text-[#ea384c]",
    activeBg: "bg-[#ea384c]/10",
  },
  {
    type: "leave",
    icon: Palmtree,
    tooltip: "Mark as Annual Leave",
    color: "text-[#1EAEDB]",
    activeBg: "bg-[#D3E4FD]",
  },
  {
    type: "toil",
    icon: Clock,
    tooltip: "Mark as TOIL (Time Off in Lieu)",
    color: "text-[#B088F9]",
    activeBg: "bg-[#E5DEFF]",
  },
  {
    type: "lunch",
    icon: Utensils,
    tooltip: "Override Lunch (Worked Through Lunch)",
    color: "text-[#1EAEDB]",
    activeBg: "bg-blue-100",
  },
];

interface WorkHoursActionButtonsProps {
  value: Record<WorkHoursActionType, boolean>;
  onToggle: (type: WorkHoursActionType) => void;
}
const buttonSize = "h-8 w-8";
const WorkHoursActionButtons: React.FC<WorkHoursActionButtonsProps> = ({ value, onToggle }) => (
  <TooltipProvider>
    <div className="flex items-center gap-2">
      {ACTIONS.map(({ type, icon: Icon, tooltip, color, activeBg }) => (
        <Tooltip key={type}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={tooltip}
              onClick={() => onToggle(type)}
              className={cn(
                "rounded-full flex items-center justify-center border border-none transition focus-visible:ring-2 focus:outline-none",
                buttonSize,
                color,
                value[type] && activeBg,
                "hover:bg-gray-100 hover:shadow", // hover effect if not active
                "relative"
              )}
              style={{
                fontSize: "1.4rem",
                transition: "background 0.2s, color 0.2s",
              }}
              tabIndex={0}
              data-testid={`hours-action-${type}`}
            >
              <Icon className={cn(buttonSize, "transition-all", value[type] ? "scale-110" : "opacity-90")} strokeWidth={2.2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="shadow-md px-3 py-1 bg-white text-gray-900 border text-sm rounded-md">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  </TooltipProvider>
);

export default WorkHoursActionButtons;

