
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Utensils, Coffee, Clock, Calendar, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkHoursActionType = "sick" | "leave" | "toil" | "lunch" | "smoko";
type ActionConf = {
  type: WorkHoursActionType;
  icon: React.ElementType;
  tooltip: string;
  adjustment?: number;
  activeColor: string;
  activeBg: string;
  baseColor?: string;
  isLeave?: boolean;
};

const ACTIONS: ActionConf[] = [
  {
    type: "leave",
    icon: Calendar,
    tooltip: "Mark as Annual Leave",
    adjustment: 0,
    activeColor: "text-sky-600",
    activeBg: "bg-sky-100",
    baseColor: "text-gray-500",
    isLeave: true,
  },
  {
    type: "sick",
    icon: Thermometer,
    tooltip: "Mark as Sick Day",
    adjustment: 0,
    activeColor: "text-[#ea384c]",
    activeBg: "bg-[#ea384c]/10",
    baseColor: "text-gray-500",
    isLeave: true,
  },
  {
    type: "toil",
    icon: Clock,
    tooltip: "Mark as TOIL (Time Off in Lieu)",
    adjustment: 0,
    activeColor: "text-purple-600",
    activeBg: "bg-purple-100",
    baseColor: "text-gray-500",
  },
  {
    type: "lunch",
    icon: Utensils,
    tooltip: "Worked Through Lunch (add 0.5h)",
    adjustment: 0.5,
    activeColor: "text-blue-600",
    activeBg: "bg-blue-100",
    baseColor: "text-gray-500",
  },
  {
    type: "smoko",
    icon: Coffee,
    tooltip: "Worked Through Smoko (add 0.25h)",
    adjustment: 0.25,
    activeColor: "text-orange-500",
    activeBg: "bg-orange-100",
    baseColor: "text-gray-500",
  },
];

export interface WorkHoursActionButtonsProps {
  value: Record<WorkHoursActionType, boolean>;
  onToggle: (type: WorkHoursActionType) => void;
}

const WorkHoursActionButtons: React.FC<WorkHoursActionButtonsProps> = ({ value, onToggle }) => (
  <TooltipProvider>
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full bg-white mx-auto w-fit mb-4 animate-fade-in"
      )}
      data-testid="work-hours-action-bar"
    >
      {ACTIONS.map(
        ({ type, icon: Icon, tooltip, activeColor, activeBg, baseColor }) => {
          const isActive = value[type];
          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={tooltip}
                  onClick={() => onToggle(type)}
                  className={cn(
                    "rounded-md flex items-center justify-center transition-colors",
                    "border border-transparent",
                    "bg-gray-50 hover:bg-gray-100",
                    isActive ? [activeColor, activeBg] : baseColor || "text-gray-500",
                    "w-9 h-9"
                  )}
                  tabIndex={0}
                  data-testid={`hours-action-${type}`}
                >
                  <Icon
                    className={cn("w-5 h-5", isActive && "scale-110")}
                    strokeWidth={2}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="shadow-sm px-3 py-1 bg-white text-gray-800 border border-gray-100 text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          );
        }
      )}
    </div>
  </TooltipProvider>
);

export default WorkHoursActionButtons;
