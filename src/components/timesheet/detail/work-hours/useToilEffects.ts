
import { useEffect } from 'react';
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('useToilEffects');

export const useToilEffects = (
  hasEntries: boolean,
  leaveActive: boolean,
  toilActive: boolean,
  isComplete: boolean,
  calculateToilForDay: () => void,
  entriesLength: number
) => {
  // Trigger TOIL calculation when conditions are met
  useEffect(() => {
    if (!hasEntries && !leaveActive && !toilActive) return;
    if (!isComplete) return;
    
    const timeoutId = setTimeout(() => {
      logger.debug('Initiating TOIL calculation based on completed timesheet');
      calculateToilForDay();
    }, 400);
    
    return () => clearTimeout(timeoutId);
  }, [hasEntries, isComplete, calculateToilForDay, entriesLength, leaveActive, toilActive]);
};
