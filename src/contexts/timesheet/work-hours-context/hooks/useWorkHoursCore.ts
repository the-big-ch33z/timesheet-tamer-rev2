
import { useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useWorkHoursLogger } from './useWorkHoursLogger';

// Cache for getWorkHours results
const workHoursCache = new Map<string, {
  result: { startTime: string; endTime: string; isCustom: boolean };
  timestamp: number;
}>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

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

  // Memoized function to format date for cache key
  const createCacheKey = useCallback((date: Date, userId: string): string => {
    const dateString = format(date, 'yyyy-MM-dd');
    return `${userId}-${dateString}`;
  }, []);

  const getWorkHours = useCallback((date: Date, userId: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const key = `${userId}-${dateString}`;
    const now = Date.now();
    
    // Check cache first
    const cachedEntry = workHoursCache.get(key);
    if (cachedEntry && (now - cachedEntry.timestamp < CACHE_EXPIRY)) {
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
  }, [getDefaultHoursFromSchedule, logWorkHoursRetrieval, logDefaultHours]);

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
  }, [logCustomHoursCheck]);

  // Function to clear cache when needed
  const clearHoursCache = useCallback(() => {
    workHoursCache.clear();
  }, []);

  // Clear cache when workHoursMap changes
  useMemo(() => {
    clearHoursCache();
  }, [workHoursMap, clearHoursCache]);

  return {
    getWorkHours,
    hasCustomWorkHours,
    clearHoursCache
  };
};

// Export function to clear cache from outside
export const clearWorkHoursCache = () => {
  workHoursCache.clear();
};
