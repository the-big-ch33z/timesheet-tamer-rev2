
import { useState, useEffect, useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { format } from "date-fns";

interface UseWorkHoursProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
}

interface UseWorkHoursReturn {
  startTime: string;
  endTime: string;
  calculatedHours: number;
  updateWorkHours: (start: string, end: string) => void;
}

/**
 * Hook to manage work hours for a day
 * Uses either existing entries or work schedule to determine default times
 */
export const useWorkHours = ({
  entries,
  date,
  workSchedule
}: UseWorkHoursProps): UseWorkHoursReturn => {
  // Helper to get default times from work schedule or use standard values
  const getDefaultTimes = () => {
    if (workSchedule?.standardHours) {
      return {
        startTime: workSchedule.standardHours.startTime || "09:00",
        endTime: workSchedule.standardHours.endTime || "17:00"
      };
    }
    return { startTime: "09:00", endTime: "17:00" };
  };
  
  // Get initial values from existing entries or defaults
  const getInitialValues = () => {
    // Check if we have entries with start and end times
    if (entries.length > 0) {
      const entriesWithTimes = entries.filter(
        entry => entry.startTime && entry.endTime
      );
      
      if (entriesWithTimes.length > 0) {
        // Use the most recent entry with times
        const latestEntry = entriesWithTimes.reduce((latest, current) => {
          const latestDate = new Date(latest.date);
          const currentDate = new Date(current.date);
          return currentDate >= latestDate ? current : latest;
        }, entriesWithTimes[0]);
        
        return {
          startTime: latestEntry.startTime || "",
          endTime: latestEntry.endTime || ""
        };
      }
    }
    
    // If no entries with times, use default from schedule
    return getDefaultTimes();
  };
  
  const initialTimes = getInitialValues();
  const [startTime, setStartTime] = useState(initialTimes.startTime);
  const [endTime, setEndTime] = useState(initialTimes.endTime);
  
  // Update times when entries change
  useEffect(() => {
    const newTimes = getInitialValues();
    setStartTime(newTimes.startTime);
    setEndTime(newTimes.endTime);
  }, [entries, date]);
  
  // Calculate hours whenever times change
  const calculatedHours = useMemo(() => {
    if (startTime && endTime) {
      try {
        return calculateHoursFromTimes(startTime, endTime);
      } catch (error) {
        console.error("Error calculating hours:", error);
        return 0;
      }
    }
    return 0;
  }, [startTime, endTime]);
  
  // Function to update work hours
  const updateWorkHours = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
  };
  
  return {
    startTime,
    endTime,
    calculatedHours,
    updateWorkHours
  };
};
