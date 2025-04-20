
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { User, WorkSchedule } from "@/types";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { formatDisplayHours } from "@/utils/time/formatting";
import { getWorkdaysInMonth } from "@/utils/time/scheduleUtils";

interface MonthSummaryProps {
  userId: string;
  date: Date;
  workSchedule?: WorkSchedule;
}

const MonthSummary: React.FC<MonthSummaryProps> = ({ 
  userId, 
  date, 
  workSchedule 
}) => {
  const [monthTotalHours, setMonthTotalHours] = useState(0);
  const [daysWorked, setDaysWorked] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const { getMonthEntries, calculateTotalHours } = useTimeEntryContext();
  
  useEffect(() => {
    setIsLoading(true);
    
    // Get entries for the month
    const monthEntries = getMonthEntries(date, userId);
    
    // Calculate total hours
    const totalHours = calculateTotalHours(monthEntries);
    setMonthTotalHours(totalHours);
    
    // Calculate days worked (unique dates with entries)
    const uniqueDates = new Set(
      monthEntries.map(entry => format(entry.date, 'yyyy-MM-dd'))
    );
    setDaysWorked(uniqueDates.size);
    
    setIsLoading(false);
  }, [date, userId, getMonthEntries, calculateTotalHours]);
  
  // Calculate workdays in month
  const workdaysInMonth = getWorkdaysInMonth(date);
  
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Total Hours</div>
              <div className="text-lg font-semibold">{formatDisplayHours(monthTotalHours)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Days Worked</div>
              <div className="text-lg font-semibold">{daysWorked} / {workdaysInMonth}</div>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-500">Month</div>
            <div>{format(date, 'MMMM yyyy')}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthSummary;
