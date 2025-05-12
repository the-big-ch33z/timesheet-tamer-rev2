
import { useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { useWorkHoursLogger } from './useWorkHoursLogger';
import { createTimeLogger } from '@/utils/time/errors';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

// Cache for getWorkHours results with expiry
const workHoursCache = new Map<string, {
  result: { startTime: string; endTime: string; isCustom: boolean };
  timestamp: number;
}>();

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const logger = createTimeLogger('WorkHoursCore');

interface UseWorkHoursCoreProps {
  workHoursMap: Map<string, any>;
  setWorkHoursMap: React.Dispatch<React.SetStateAction<Map<string, any>>>;
  latestWorkHoursRef: React.MutableRefObject<Map<string, any>>;
  getDefaultHoursFromSchedule: (date: Date, userId: string) => { startTime: string; endTime: string };
}

export const useWorkHoursCore = ({
  workHoursMap,
  setWorkHoursMap,
  latestWorkHoursRef,
  getDefaultHoursFromSchedule
}: UseWorkHoursCoreProps) => {
  const { logWorkHoursRetrieval, logDefaultHours, logCustomHoursCheck } = useWorkHoursLogger();
  
  // Keep track of last schedule refresh time
  const lastScheduleRefreshRef = useRef<number>(Date.now());

  // Memoized function to format date for cache key
  const createCacheKey = useCallback((date: Date, userId: string): string => {
    const dateString = format(date, 'yyyy-MM-dd');
    return `${userId}-${dateString}`;
  }, []);

  // Clear cache manually
  const clearCache = useCallback(() => {
    workHoursCache.clear();
    lastScheduleRefreshRef.current = Date.now();
    logger.debug('Work hours cache cleared');
  }, []);

  // Subscribe to schedule update events
  useMemo(() => {
    const scheduleUpdatedUnsubscribe = timeEventsService.subscribe('schedules-updated', () => {
      logger.debug('Received schedules-updated event, clearing cache');
      clearCache();
    });
    
    const userScheduleUpdatedUnsubscribe = timeEventsService.subscribe('user-schedules-updated', () => {
      logger.debug('Received user-schedules-updated event, clearing cache');
      clearCache();
    });
    
    const scheduleChangedUnsubscribe = timeEventsService.subscribe('user-schedule-changed', () => {
      logger.debug('Received user-schedule-changed event, clearing cache');
      clearCache();
    });

    return () => {
      scheduleUpdatedUnsubscribe.unsubscribe();
      userScheduleUpdatedUnsubscribe.unsubscribe();
      scheduleChangedUnsubscribe.unsubscribe();
    };
  }, [clearCache]);

  const getWorkHours = useCallback((date: Date, userId: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    const now = Date.now();
    
    // Check cache first - only if not expired and no schedule refresh since cache entry
    const cachedEntry = workHoursCache.get(key);
    if (cachedEntry && 
        (now - cachedEntry.timestamp < CACHE_EXPIRY) && 
        cachedEntry.timestamp > lastScheduleRefreshRef.current) {
      return cachedEntry.result;
    }
    
    const savedHours = latestWorkHoursRef.current.get(key);
    // Only log at debug level and only in development
    if (process.env.NODE_ENV === 'development') {
      logWorkHoursRetrieval(dateString, userId, savedHours);
    }
    
    if (savedHours) {
      const result = {
        startTime: savedHours.startTime || "",
        endTime: savedHours.endTime || "",
        isCustom: savedHours.isCustom
      };
      
      // Cache result
      workHoursCache.set(key, {
        result,
        timestamp: now
      });
      
      return result;
    }
    
    // Get current default hours from schedule - this will reflect the latest schedule
    const defaultHours = getDefaultHoursFromSchedule(date, userId);
    
    // Only log at debug level
    if (process.env.NODE_ENV === 'development') {
      logDefaultHours(dateString, defaultHours.startTime, defaultHours.endTime);
    }
    
    const result = {
      startTime: defaultHours.startTime,
      endTime: defaultHours.endTime,
      isCustom: false
    };
    
    // Cache result
    workHoursCache.set(key, {
      result,
      timestamp: now
    });
    
    return result;
  }, [getDefaultHoursFromSchedule, logWorkHoursRetrieval, logDefaultHours, latestWorkHoursRef]);

  const hasCustomWorkHours = useCallback((date: Date, userId: string): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    const hasHours = latestWorkHoursRef.current.has(key) && 
                    latestWorkHoursRef.current.get(key)?.isCustom === true;
    
    // Only log at debug level
    if (process.env.NODE_ENV === 'development') {
      logCustomHoursCheck(dateString, userId, hasHours);
    }
    return hasHours;
  }, [logCustomHoursCheck, latestWorkHoursRef]);

  // Immediately clear cache when workHoursMap changes
  useMemo(() => {
    clearCache();
  }, [workHoursMap, clearCache]);

  return {
    getWorkHours,
    hasCustomWorkHours,
    clearCache
  };
};

// Export function to clear cache from outside
export const clearWorkHoursCache = (): void => {
  workHoursCache.clear();
  logger.debug('Work hours cache cleared globally');
};
