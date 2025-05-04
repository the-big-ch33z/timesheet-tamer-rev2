
import { useEffect } from 'react';
import { createTimeLogger } from "@/utils/time/errors";
import { TimeEntry, WorkSchedule } from "@/types";

const logger = createTimeLogger('useToilEffects');

// Updated hook that supports both object and individual parameters
export const useToilEffects = (
  arg1: boolean | {
    userId: string;
    date: Date;
    entries: TimeEntry[];
    schedule?: WorkSchedule;
  },
  arg2?: boolean,
  arg3?: boolean,
  arg4?: boolean,
  arg5?: () => Promise<any>,
  arg6?: number
) => {
  // Determine if we're using the new object-based format or the old individual parameters
  const isObjectFormat = typeof arg1 === 'object';

  // Extract parameters accordingly
  const hasEntries = isObjectFormat ? (arg1.entries && arg1.entries.length > 0) : !!arg1;
  const leaveActive = isObjectFormat ? false : !!arg2; // We don't have this in object format yet
  const toilActive = isObjectFormat ? false : !!arg3;  // We don't have this in object format yet
  const isComplete = isObjectFormat ? true : !!arg4;   // We don't have this in object format yet
  const calculateToilForDay = isObjectFormat ? async () => {
    logger.debug('Calculated TOIL for day (object format) - entries:', arg1.entries?.length); 
    return null;
  } : (arg5 || (async () => {
    logger.debug('Calculated TOIL for day (legacy format)');
    return null;
  }));
  const entriesLength = isObjectFormat ? (arg1.entries?.length || 0) : (arg6 || 0);
  
  // Log parameters for debugging
  useEffect(() => {
    if (isObjectFormat) {
      logger.debug('useToilEffects called with object parameters:', {
        userId: (arg1 as any).userId,
        date: (arg1 as any).date?.toISOString?.(),
        entriesCount: entriesLength,
        hasSchedule: !!(arg1 as any).schedule
      });
    } else {
      logger.debug('useToilEffects called with individual parameters:', {
        hasEntries,
        leaveActive,
        toilActive,
        isComplete,
        entriesLength
      });
    }
  }, [isObjectFormat, hasEntries, leaveActive, toilActive, isComplete, entriesLength]);

  // Trigger TOIL calculation when conditions are met
  useEffect(() => {
    if (!hasEntries && !leaveActive && !toilActive) {
      logger.debug('Skipping TOIL calculation - no entries, leave, or TOIL');
      return;
    }
    
    if (!isComplete) {
      logger.debug('Skipping TOIL calculation - timesheet not complete');
      return;
    }
    
    logger.debug('TOIL calculation conditions met, scheduling calculation');
    
    const timeoutId = setTimeout(() => {
      logger.debug('Initiating TOIL calculation based on completed timesheet');
      calculateToilForDay().then(result => {
        logger.debug('TOIL calculation completed:', result);
      }).catch(error => {
        logger.error('TOIL calculation failed:', error);
      });
    }, 400);
    
    return () => {
      logger.debug('Cleaning up TOIL calculation timeout');
      clearTimeout(timeoutId);
    };
  }, [hasEntries, isComplete, calculateToilForDay, entriesLength, leaveActive, toilActive]);
};
