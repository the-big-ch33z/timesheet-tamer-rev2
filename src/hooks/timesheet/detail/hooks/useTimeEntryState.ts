
import { useState, useEffect, useCallback } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { useWorkHoursContext } from '@/contexts/timesheet';
import { 
  calculateHoursFromTimes, 
  calculateHoursVariance, 
  isUndertime as checkIsUndertime
} from '@/utils/time/calculations/timeCalculations';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useTimeEntryState');

interface UseTimeEntryStateProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive: boolean;
  userId: string;
  onHoursChange?: (hours: number) => void;
}

export const useTimeEntryState = ({
  entries,
  date,
  workSchedule,
  interactive,
  userId,
  onHoursChange
}: UseTimeEntryStateProps) => {
  // Get work hours from context
  const { getWorkHoursForDate, saveWorkHoursForDate } = useWorkHoursContext();
  
  // Get stored work hours for this date and user
  const storedWorkHours = getWorkHoursForDate(date, userId);
  
  // State for start and end times
  const [startTime, setStartTime] = useState(storedWorkHours?.startTime || '09:00');
  const [endTime, setEndTime] = useState(storedWorkHours?.endTime || '17:00');
  
  // Total hours from all entries
  const totalEnteredHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  
  // Calculate target hours for the day based on workSchedule
  const targetHours = 8; // Default to 8 hours if no schedule
  
  // Calculate hours variance
  const hoursVariance = calculateHoursVariance(totalEnteredHours, targetHours);
  const isUndertime = checkIsUndertime(hoursVariance);
  
  // Flag if we have entries
  const hasEntries = entries.length > 0;
  
  // Normalize a time value to ensure HH:MM format
  const normalizeTimeValue = useCallback((value: string): string => {
    if (!value) return "";
    
    // If already in HH:MM format, ensure hours are two digits
    if (/^\d{1,2}:\d{2}$/.test(value)) {
      const [hours, minutes] = value.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    // If just a number, convert to HH:00 format
    if (/^\d{1,2}$/.test(value)) {
      return `${value.padStart(2, '0')}:00`;
    }
    
    return value;
  }, []);

  // Update start/end times and recalculate hours
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    if (!interactive) return;
    
    const normalizedValue = normalizeTimeValue(value);

    try {
      if (type === 'start') {
        setStartTime(normalizedValue);
        saveWorkHoursForDate(date, normalizedValue, endTime, userId);
      } else {
        setEndTime(normalizedValue);
        saveWorkHoursForDate(date, startTime, normalizedValue, userId);
      }
      
      // Calculate hours if we have both start and end times
      if (startTime && endTime) {
        try {
          const calculatedHours = calculateHoursFromTimes(
            type === 'start' ? normalizedValue : startTime,
            type === 'end' ? normalizedValue : endTime
          );
          
          if (onHoursChange) {
            onHoursChange(calculatedHours);
          }
        } catch (err) {
          logger.error('Error calculating hours:', err);
        }
      }
    } catch (err) {
      logger.error(`Error handling time change for ${type}:`, err);
    }
  }, [startTime, endTime, interactive, date, userId, saveWorkHoursForDate, onHoursChange]);
  
  // Initialize with stored values on mount
  useEffect(() => {
    if (storedWorkHours) {
      setStartTime(storedWorkHours.startTime);
      setEndTime(storedWorkHours.endTime);
    }
  }, [date, userId]);
  
  // Log for debugging
  useEffect(() => {
    logger.debug(`TimeEntryState initialized for date ${date.toISOString()}`, {
      startTime,
      endTime,
      hasEntries,
      entriesCount: entries.length
    });
  }, [date, entries.length]);

  return {
    startTime,
    endTime,
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    handleTimeChange
  };
};
