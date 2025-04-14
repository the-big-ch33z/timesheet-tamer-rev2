
import React, { useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidDate, ensureDate } from "@/utils/time/validation";
import { formatDateForDisplay } from "@/utils/time/formatting";

interface DateFieldProps {
  date: Date;
  setDate: (date: Date) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const DateField: React.FC<DateFieldProps> = ({ 
  date, 
  setDate, 
  label = "Date",
  disabled = false,
  className = ""
}) => {
  // Validate date on mount and when it changes
  useEffect(() => {
    if (date && !isValidDate(date)) {
      console.warn("DateField received invalid date:", date);
      // Set to today's date if invalid
      setDate(new Date());
    }
  }, [date, setDate]);

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate && isValidDate(newDate)) {
      setDate(newDate);
    }
  };

  // Ensure we're working with a valid date
  const safeDate = date && isValidDate(date) ? date : new Date();
  
  // Use format from date-fns for consistent formatting
  const displayDate = formatDateForDisplay(safeDate);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="date">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
            data-testid="date-field-button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? displayDate : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={safeDate}
            onSelect={handleDateChange}
            initialFocus
            className="p-3 pointer-events-auto"
            data-testid="date-field-calendar"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateField;
