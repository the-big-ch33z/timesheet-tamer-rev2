
import { useWorkHoursContext } from '@/contexts/timesheet/work-hours-context/WorkHoursContext';
import { useCallback, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { useTimesheetWorkHours } from './useTimesheetWorkHours';
import { useTimeCalculations } from './useTimeCalculations';
import { unifiedTimeEntryService } from '@/utils/time/services';

const logger = createTimeLogger('useWorkHours');

/**
 * Enhanced hook for working with work hours
 * This is a compatibility layer that uses useTimesheetWorkHours internally
 * but maintains the original API for backward compatibility
 */
export const useWorkHours = (userId?: string) => {
  // Use the enhanced implementation for core functionality
  const enhancedHook = useTimesheetWorkHours(userId);
  
  // Use our centralized calculation hook
  const { calculateHours } = useTimeCalculations();
  
  logger.debug('useWorkHours initialized (compatibility wrapper)');
  
  // Add additional functionality for TimeEntryManager integration
  const calculateAutoHours = useCallback((startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    try {
      return calculateHours(startTime, endTime);
    } catch (error) {
      logger.error(`Error calculating hours: ${error}`);
      return 0;
    }
  }, [calculateHours]);
  
  // Add compatibility methods for tests
  const hasCustomHours = useCallback((date: Date, userId?: string): boolean => {
    const hours = enhancedHook.getWorkHoursForDate(date, userId);
    return !!hours.startTime && !!hours.endTime;
  }, [enhancedHook]);
  
  const resetWorkHours = useCallback((date: Date, userId?: string): void => {
    enhancedHook.resetWorkHoursForDate(date, userId);
  }, [enhancedHook]);
  
  const calculateDayHours = useCallback((date: Date): number => {
    const hours = enhancedHook.getWorkHoursForDate(date, userId);
    if (hours.startTime && hours.endTime) {
      return calculateAutoHours(hours.startTime, hours.endTime);
    }
    return 0;
  }, [enhancedHook, calculateAutoHours, userId]);
  
  // Extend the hook with the additional methods needed for backward compatibility
  return {
    ...enhancedHook,
    calculateAutoHours,
    hasCustomHours,
    resetWorkHours,
    calculateDayHours
  };
};

export default useWorkHours;
