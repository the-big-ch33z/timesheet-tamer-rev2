
import { useCallback } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { calculateHoursVariance, isUndertime } from '@/utils/time/calculations/timeCalculations';
import { UseWorkHoursOptions } from '../types/workHoursTypes';
import { WorkHoursData } from '@/contexts/timesheet/types';

const logger = createTimeLogger('useWorkHoursUtilities');

/**
 * Hook for work hours utility functions
 * Handles checks, verifications, and utilities
 */
export const useWorkHoursUtilities = (options: UseWorkHoursOptions = {}, calculateAutoHours: (start: string, end: string) => number) => {
  const { userId, entries = [] } = options;

  // Check if custom hours exist for a date
  const hasCustomHours = useCallback((date: Date, targetUserId?: string): boolean => {
    const effectiveUserId = targetUserId || userId;
    if (!effectiveUserId) return false;
    
    const hours = options.getWorkHoursForDate?.(date, effectiveUserId);
    return !!hours?.startTime && !!hours?.endTime && !!hours?.hasData;
  }, [options.getWorkHoursForDate, userId]);
  
  // Reset work hours for a specific date
  const resetWorkHours = useCallback((date: Date, targetUserId?: string): void => {
    const effectiveUserId = targetUserId || userId;
    if (!effectiveUserId) return;
    
    options.resetWorkHoursForDate?.(date, effectiveUserId);
  }, [options.resetWorkHoursForDate, userId]);
  
  // Clear all work hours (for compatibility)
  const clearAllWorkHours = useCallback((targetUserId?: string): void => {
    const effectiveUserId = targetUserId || userId;
    if (!effectiveUserId) return;
    
    logger.debug('clearAllWorkHours called - operation replaced with refreshWorkHours');
    options.refreshWorkHours?.(undefined, effectiveUserId);
  }, [options.refreshWorkHours, userId]);

  // Calculate work hours statistics from entries
  const getWorkHoursStats = useCallback(() => {
    if (!entries || entries.length === 0) {
      return {
        totalEnteredHours: 0,
        hasEntries: false,
        hoursVariance: 0,
        isUndertime: false
      };
    }

    // Total hours from all entries
    const totalEnteredHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    
    // Calculate target hours (ideally from schedule, default to 8)
    const targetHours = 8; // Default - in a real implementation this would come from schedule
    
    return {
      totalEnteredHours,
      hasEntries: entries.length > 0,
      hoursVariance: calculateHoursVariance(totalEnteredHours, targetHours),
      isUndertime: isUndertime(totalEnteredHours, targetHours)
    };
  }, [entries]);

  // Add a wrapper method for test compatibility
  const getWorkHoursForDateWithCalculated = useCallback((date: Date, targetUserId?: string): WorkHoursData & { calculatedHours: number } => {
    const effectiveUserId = targetUserId || userId;
    if (!effectiveUserId) {
      // Return a valid WorkHoursData object with calculatedHours
      return {
        startTime: "",
        endTime: "",
        calculatedHours: 0,
        isCustom: false,
        hasData: false,
        date: format(date, 'yyyy-MM-dd'),
        userId: "",
        lastModified: Date.now()
      };
    }
    
    const hours = options.getWorkHoursForDate?.(date, effectiveUserId);
    const calculatedHours = (hours?.startTime && hours?.endTime) 
      ? calculateAutoHours(hours.startTime, hours.endTime) 
      : 0;
      
    // Return a complete WorkHoursData object with calculatedHours
    return {
      startTime: hours?.startTime || "",
      endTime: hours?.endTime || "",
      calculatedHours,
      isCustom: !!hours?.hasData,
      hasData: !!hours?.hasData,
      // Add the required WorkHoursData properties
      date: format(date, 'yyyy-MM-dd'),
      userId: effectiveUserId,
      lastModified: hours?.lastModified || Date.now()
    };
  }, [options.getWorkHoursForDate, calculateAutoHours, userId]);

  return {
    hasCustomHours,
    resetWorkHours,
    clearAllWorkHours,
    getWorkHoursStats,
    getWorkHoursForDateWithCalculated
  };
};
