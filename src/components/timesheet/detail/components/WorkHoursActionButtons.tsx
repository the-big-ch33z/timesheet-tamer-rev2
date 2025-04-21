
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Plane, Syringe, Utensils, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkHoursActionType = "sick" | "leave" | "toil" | "lunch";
type ActionConf = {
  type: WorkHoursActionType | "coffee";
  icon: React.ElementType;
  tooltip: string;
  color: string;
  activeBg: string;
  disabled?: boolean;
};

const ACTIONS: ActionConf[] = [
  {
    type: "leave",
    icon: Plane,
    tooltip: "Mark as Annual Leave",
    color: "text-sky-500",
    activeBg: "bg-sky-100",
  },
  {
    type: "sick",
    icon: Syringe,
    tooltip: "Mark as Sick Day",
    color: "text-[#ea384c]",
    activeBg: "bg-[#ea384c]/10",
  },
  {
    type: "toil",
    icon: Clock,
    tooltip: "Mark as TOIL (Time Off in Lieu)",
    color: "text-purple-500",
    activeBg: "bg-purple-100",
  },
  {
    type: "lunch",
    icon: Utensils,
    tooltip: "Override Lunch (Worked Through Lunch)",
    color: "text-blue-500",
    activeBg: "bg-blue-100",
  },
  {
    type: "coffee",
    icon: Coffee,
    tooltip: "Coffee break (no action)",
    color: "text-amber-500",
    activeBg: "bg-amber-100",
    disabled: true,
  }
];

interface WorkHoursActionButtonsProps {
  value: Record<WorkHoursActionType, boolean>;
  onToggle: (type: WorkHoursActionType) => void;
}

const WorkHoursActionButtons: React.FC<WorkHoursActionButtonsProps> = ({ value, onToggle }) => (
  <TooltipProvider>
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full shadow-md bg-white border border-gray-200 mx-auto",
        "w-fit mb-4",
        "animate-fade-in"
      )}
      data-testid="work-hours-action-bar"
    >
      {ACTIONS.map(
        ({ type, icon: Icon, tooltip, color, activeBg, disabled }) => {
          const isActive = type !== "coffee" ? value[type as WorkHoursActionType] : false;
          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                {type !== "coffee" ? (
                  <button
                    type="button"
                    aria-label={tooltip}
                    onClick={() => onToggle(type as WorkHoursActionType)}
                    className={cn(
                      "rounded-md flex items-center justify-center focus-visible:ring-2 focus:outline-none transition-colors",
                      "border border-gray-100",
                      "bg-gray-50 hover:bg-gray-100",
                      color,
                      isActive && activeBg,
                      "w-9 h-9"
                    )}
                    tabIndex={0}
                    data-testid={`hours-action-${type}`}
                  >
                    <Icon className={cn("w-5 h-5", isActive && "scale-110")} strokeWidth={2} />
                  </button>
                ) : (
                  <span
                    className={cn(
                      "rounded-md flex items-center justify-center",
                      "border border-gray-100",
                      "bg-gray-50",
                      "w-9 h-9 cursor-default",
                      color,
                    )}
                    aria-label={tooltip}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </span>
                )}
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
