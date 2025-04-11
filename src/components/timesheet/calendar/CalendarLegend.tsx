
import React from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarLegendProps {
  hasWorkSchedule: boolean;
}

const CalendarLegend: React.FC<CalendarLegendProps> = ({ hasWorkSchedule }) => {
  return (
    <div className="flex flex-wrap gap-3 mb-3 text-xs">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded bg-white border border-gray-200 mr-1"></div>
        <span>Working Day</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded bg-gray-200 mr-1"></div>
        <span>Weekend</span>
      </div>
      {hasWorkSchedule && (
        <div className="flex items-center">
          <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200 mr-1"></div>
          <span>RDO</span>
        </div>
      )}
      <div className="flex items-center">
        <div className="w-3 h-3 rounded bg-[#FEF7CD] border border-amber-200 mr-1"></div>
        <span>Holiday</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300 mr-1"></div>
        <span>Non-Working Day</span>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full w-5 h-5 p-0">
              <HelpCircle className="h-4 w-4 text-gray-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs max-w-xs">
              Working days are based on your schedule. RDOs are rostered days off.
              Hover over days to see more details.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default CalendarLegend;
