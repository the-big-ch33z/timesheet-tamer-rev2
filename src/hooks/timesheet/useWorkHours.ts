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
  
  return {
    ...enhancedHook,
    calculateAutoHours
  };
};
