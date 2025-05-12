
import { useEffect } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useToilEffects');

export interface UseToilEffectsProps {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  schedule?: WorkSchedule;
  hasEntries: boolean;
  leaveActive: boolean;
  toilActive: boolean;
  isComplete: boolean;
  calculateToilForDay: () => Promise<void>; // Updated to Promise<void>
  entriesCount: number;
}

/**
 * Hook that handles side effects for TOIL calculations
 * Automatically triggers TOIL calculations when conditions are met
 */
export const useToilEffects = ({
  userId,
  date,
  entries,
  schedule,
  hasEntries,
  leaveActive,
  toilActive,
  isComplete,
  calculateToilForDay,
  entriesCount
}: UseToilEffectsProps) => {
  // Trigger TOIL calculation when entries change and day is complete
  useEffect(() => {
    // Only calculate if:
    // 1. We have entries
    // 2. No leave or TOIL is active
    // 3. The day is marked as complete
    if (hasEntries && !leaveActive && !toilActive && isComplete) {
      logger.debug(`[useToilEffects] Auto-calculating TOIL for complete day: ${date.toISOString().split('T')[0]}`);
      calculateToilForDay().catch(error => {
        logger.error('TOIL calculation failed:', error);
      });
    }
  }, [hasEntries, leaveActive, toilActive, isComplete, date, calculateToilForDay, entriesCount]);
};

export default useToilEffects;
