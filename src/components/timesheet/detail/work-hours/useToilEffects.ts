
import { useEffect, useCallback, useRef } from 'react';
import { createTimeLogger } from "@/utils/time/errors";
import { TimeEntry, WorkSchedule } from "@/types";
import { toilService } from "@/utils/time/services/toil";
import { timeEventsService } from '@/utils/time/events/timeEventsService';

const logger = createTimeLogger('useToilEffects');

// Type for unified parameter object
export interface UseToilEffectsParams {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  schedule?: WorkSchedule;
  leaveActive?: boolean;
  toilActive?: boolean;
  isComplete?: boolean;
}

// Updated hook that supports both object and individual parameters
export const useToilEffects = (
  arg1: UseToilEffectsParams | boolean,
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
  const leaveActive = isObjectFormat ? !!arg1.leaveActive : !!arg2; 
  const toilActive = isObjectFormat ? !!arg1.toilActive : !!arg3;  
  const isComplete = isObjectFormat ? (arg1.isComplete !== false) : !!arg4;   
  const entriesLength = isObjectFormat ? (arg1.entries?.length || 0) : (arg6 || 0);
  
  // For object format, create a function that calls toilService directly
  // For legacy format, use the provided function or a no-op
  const calculateToilForDay = useRef(
    isObjectFormat 
      ? async () => {
          try {
            if (!arg1.userId || !arg1.date || !arg1.entries || !arg1.entries.length) {
              logger.debug('Skipping TOIL calculation - missing required data');
              return null;
            }
            
            if (!arg1.schedule) {
              logger.debug('Skipping TOIL calculation - no work schedule available');
              return null;
            }
            
            const holidays = await import('@/lib/holidays').then(m => m.getHolidays());
            
            logger.debug(`Calculating TOIL for ${arg1.userId} on ${arg1.date.toISOString()} with ${arg1.entries.length} entries`);
            
            const result = await toilService.calculateAndStoreTOIL(
              arg1.entries,
              arg1.date,
              arg1.userId,
              arg1.schedule!,
              holidays
            );
            
            if (result) {
              logger.debug('TOIL calculation successful:', result);
              
              // Dispatch event for UI updates
              timeEventsService.publish('toil-updated', {
                userId: arg1.userId,
                date: arg1.date.toISOString(),
                summary: result
              });
            }
            
            return result;
          } catch (err) {
            logger.error('TOIL calculation failed:', err);
            return null;
          }
        }
      : (arg5 || (async () => {
          logger.debug('Using legacy TOIL calculation function');
          return null;
        }))
  ).current;
  
  // Log parameters for debugging
  useEffect(() => {
    if (isObjectFormat) {
      logger.debug('useToilEffects called with object parameters:', {
        userId: (arg1 as UseToilEffectsParams).userId,
        date: (arg1 as UseToilEffectsParams).date?.toISOString?.(),
        entriesCount: entriesLength,
        hasSchedule: !!(arg1 as UseToilEffectsParams).schedule
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
  }, [isObjectFormat, hasEntries, leaveActive, toilActive, isComplete, entriesLength, arg1]);

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
      calculateToilForDay().catch(error => {
        logger.error('TOIL calculation failed:', error);
      });
    }, 400);
    
    return () => {
      logger.debug('Cleaning up TOIL calculation timeout');
      clearTimeout(timeoutId);
    };
  }, [hasEntries, isComplete, calculateToilForDay, entriesLength, leaveActive, toilActive]);
};
