
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
  // Coffee cup at end, static, no action
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
        "flex items-center gap-3 px-3 py-2 rounded-full shadow-xl bg-white/70 backdrop-blur-[2.5px] border border-gray-100 mx-auto",
        "w-fit mb-3",
        "ring-1 ring-gray-200",
        "hover:shadow-2xl transition-all",
        "animate-fade-in"
      )}
      style={{
        boxShadow: "0 2px 16px rgba(20,20,60,0.10), 0 1.5px 3px 0 rgba(60,60,64,0.08)",
        backdropFilter: "blur(8px)"
      }}
      data-testid="work-hours-action-bar"
    >
      {ACTIONS.map(
        ({ type, icon: Icon, tooltip, color, activeBg, disabled }) => {
          // Only clickable if not coffee
          const isActive = type !== "coffee" ? value[type as WorkHoursActionType] : false;
          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                {/* Only main actions are clickable */}
                {type !== "coffee" ? (
                  <button
                    type="button"
                    aria-label={tooltip}
                    onClick={() => onToggle(type as WorkHoursActionType)}
                    className={cn(
                      "rounded-full flex items-center justify-center focus-visible:ring-2 focus:outline-none transition-all border-none shadow-none",
                      "bg-transparent",
                      color,
                      isActive && activeBg,
                      "hover:bg-gray-100",
                      "w-10 h-10",
                      "relative"
                    )}
                    style={{
                      fontSize: "1.45rem",
                      transition: "background 0.16s, color 0.16s",
                    }}
                    tabIndex={0}
                    data-testid={`hours-action-${type}`}
                  >
                    <Icon className={cn("w-6 h-6", isActive ? "scale-110" : "opacity-90", "transition-all")} strokeWidth={2.2} />
                  </button>
                ) : (
                  <span
                    className={cn(
                      "rounded-full flex items-center justify-center",
                      "w-10 h-10 cursor-default bg-transparent",
                      color,
                      "opacity-60"
                    )}
                    aria-label={tooltip}
                  >
                    <Icon className="w-6 h-6" strokeWidth={2.2} />
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="shadow-lg px-4 py-1.5 bg-white/90 text-gray-900 border border-gray-200 text-sm rounded-md">
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
