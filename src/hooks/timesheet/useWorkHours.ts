
import { useWorkHoursContext } from '@/contexts/timesheet/work-hours-context/WorkHoursContext';
import { useCallback } from 'react';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { useTimesheetWorkHours } from './useTimesheetWorkHours';
import { useTimeCalculations } from './useTimeCalculations';
import { WorkHoursData } from '@/contexts/timesheet/types';

/**
 * useWorkHours
 * 
 * Legacy compatibility hook for working with work hours
 * This hook maintains the original API for backward compatibility
 * but internally uses the new standardized hooks
 */
const logger = createTimeLogger('useWorkHours');

/**
 * Comprehensive hook for work hours management
 * Combines functionality from both new and legacy APIs
 * 
 * @param userId - Optional user ID to use if not specified in method calls
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
    return !!hours.startTime && !!hours.endTime && !!hours.hasData;
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
  
  // Add a wrapper method that includes calculatedHours for test compatibility
  const getWorkHoursForDateWithCalculated = useCallback((date: Date, userId?: string): WorkHoursData => {
    const hours = enhancedHook.getWorkHoursForDate(date, userId);
    const calculatedHours = (hours.startTime && hours.endTime) 
      ? calculateAutoHours(hours.startTime, hours.endTime) 
      : 0;
      
    return {
      ...hours,
      calculatedHours,
      isCustom: !!hours.hasData, // For backward compatibility
      date: date.toISOString().split('T')[0], // Ensure date is included
      userId: userId || '', // Ensure userId is included
      lastModified: Date.now() // Ensure lastModified is included
    };
  }, [enhancedHook, calculateAutoHours]);
  
  // Compatibility method for clearAllWorkHours
  const clearAllWorkHours = useCallback((userId?: string): void => {
    // This is a no-op in the new system as we rely on refreshWorkHours instead
    logger.debug('clearAllWorkHours called - operation replaced with refreshWorkHours');
    enhancedHook.refreshWorkHours(undefined, userId);
  }, [enhancedHook]);
  
  // Extend the hook with the additional methods needed for backward compatibility
  return {
    ...enhancedHook,
    calculateAutoHours,
    hasCustomHours,
    resetWorkHours,
    calculateDayHours,
    clearAllWorkHours,
    getWorkHoursForDate: getWorkHoursForDateWithCalculated
  };
};

export default useWorkHours;
