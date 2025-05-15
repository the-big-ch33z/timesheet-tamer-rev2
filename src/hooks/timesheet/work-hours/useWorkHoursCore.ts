
import { useState, useEffect } from 'react';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { useTimesheetWorkHours } from '../useTimesheetWorkHours';
import { UseWorkHoursOptions } from '../types/workHoursTypes';
import { useToast } from '@/hooks/use-toast';

const logger = createTimeLogger('useWorkHoursCore');

/**
 * Core hook for work hours functionality
 * Handles basic state and data loading
 */
export const useWorkHoursCore = (options: UseWorkHoursOptions = {}) => {
  const { userId, date } = options;
  const { toast } = useToast();

  // Use the enhanced implementation for core functionality
  const {
    getWorkHoursForDate,
    saveWorkHoursForDate,
    resetWorkHoursForDate,
    refreshWorkHours
  } = useTimesheetWorkHours(userId);
  
  // State for tracking times
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [isProcessingSave, setIsProcessingSave] = useState(false);
  
  // Load work hours when date or userId changes
  useEffect(() => {
    if (!date || !userId) return;
    
    logger.debug(`Loading work hours for date: ${date.toDateString()}, userId: ${userId}`);
    const { startTime: loadedStart, endTime: loadedEnd } = getWorkHoursForDate(date, userId);
    
    setStartTime(loadedStart || "");
    setEndTime(loadedEnd || "");
  }, [date, userId, getWorkHoursForDate]);

  return {
    // State
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    calculatedHours,
    setCalculatedHours,
    isProcessingSave,
    setIsProcessingSave,
    
    // Core methods
    getWorkHoursForDate,
    saveWorkHoursForDate,
    resetWorkHoursForDate,
    refreshWorkHours,
    
    // Additional context
    toast
  };
};
