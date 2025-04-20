
import { useState, useRef, useCallback, useEffect } from 'react';
import { WorkHoursData } from '../types';
import { workHoursStorage } from '../workHoursStorage';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useWorkHoursState');
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

export const useWorkHoursState = () => {
  const [workHoursMap, setWorkHoursMap] = useState<Map<string, WorkHoursData>>(new Map());
  const latestWorkHoursRef = useRef<Map<string, WorkHoursData>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  const cleanupCache = useCallback(() => {
    const now = Date.now();
    let hasExpiredEntries = false;
    
    const newMap = new Map<string, WorkHoursData>();
    latestWorkHoursRef.current.forEach((value, key) => {
      if (now - value.lastModified < CACHE_EXPIRATION) {
        newMap.set(key, value);
      } else {
        hasExpiredEntries = true;
        logger.debug(`Removing expired work hours entry: ${key}`);
      }
    });
    
    if (hasExpiredEntries) {
      latestWorkHoursRef.current = newMap;
      setWorkHoursMap(newMap);
      logger.info('Cache cleanup completed, removed expired entries');
    }
  }, []);

  // Load initial data from storage
  useEffect(() => {
    const savedData = workHoursStorage.loadWorkHours();
    setWorkHoursMap(savedData);
    latestWorkHoursRef.current = savedData;
    isInitializedRef.current = true;
    
    const cleanupInterval = setInterval(cleanupCache, 60 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    workHoursMap,
    setWorkHoursMap,
    latestWorkHoursRef,
    saveTimeoutRef,
    isInitializedRef,
    cleanupCache
  };
};
