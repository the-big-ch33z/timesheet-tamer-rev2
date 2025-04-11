
import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface CalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentMonth,
  onPrevMonth,
  onNextMonth
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <Button variant="outline" size="icon" onClick={onPrevMonth} className="rounded-full w-10 h-10">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2">
        <h2 className="text-xl font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button variant="outline" size="icon" className="rounded-full w-8 h-8">
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </div>

      <Button variant="outline" size="icon" onClick={onNextMonth} className="rounded-full w-10 h-10">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CalendarHeader;
