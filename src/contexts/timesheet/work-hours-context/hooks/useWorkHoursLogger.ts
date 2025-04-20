
import { useCallback } from 'react';
import { createTimeLogger } from '@/utils/time/errors';
import { format } from 'date-fns';

const logger = createTimeLogger('useWorkHoursLogger');

export const useWorkHoursLogger = () => {
  const logWorkHoursRetrieval = useCallback((dateString: string, userId: string, hours: any) => {
    if (hours) {
      logger.debug(`Found saved hours for ${dateString}:`, hours);
    } else {
      logger.debug(`No saved hours for ${dateString}`);
    }
  }, []);

  const logDefaultHours = useCallback((dateString: string, startTime: string, endTime: string) => {
    logger.debug(`No saved hours for ${dateString}, returning derived schedule hours: ${startTime}-${endTime}`);
  }, []);

  const logCustomHoursCheck = useCallback((dateString: string, userId: string, hasHours: boolean) => {
    logger.debug(`Checking for custom hours for ${dateString}, userId: ${userId}, result: ${hasHours}`);
  }, []);

  return {
    logWorkHoursRetrieval,
    logDefaultHours,
    logCustomHoursCheck
  };
};
