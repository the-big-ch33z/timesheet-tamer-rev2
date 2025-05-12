
import { useState, useCallback } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { createTimeLogger } from '@/utils/time/errors';
import { useTOILCalculations } from './useTOILCalculations';

const logger = createTimeLogger('useTOILTriggers');

interface UseTOILTriggersProps {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  workSchedule?: WorkSchedule;
  holidays: any[];
}

export const useTOILTriggers = ({
  userId,
  date,
  entries,
  workSchedule,
  holidays
}: UseTOILTriggersProps) => {
  const [isCalculating, setIsCalculating] = useState(false);

  // Use TOIL calculation tools
  const { calculateToilForDay } = useTOILCalculations({
    userId,
    date,
    entries,
    workSchedule
  });

  // Handle manual TOIL calculation trigger
  const triggerTOILCalculation = useCallback(async () => {
    logger.debug('Manually triggering TOIL calculation');
    setIsCalculating(true);
    
    try {
      await calculateToilForDay();
      logger.debug('Manual TOIL calculation complete');
    } catch (error) {
      logger.error('Error during manual TOIL calculation:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [calculateToilForDay]);

  return {
    triggerTOILCalculation,
    isCalculating
  };
};
