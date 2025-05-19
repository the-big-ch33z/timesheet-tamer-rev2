
import { useEffect } from 'react';
import { WorkSchedule } from '@/types';
import { useLogger } from '@/hooks/useLogger';

/**
 * Hook to log work schedule information for debugging
 */
export const useWorkScheduleLogger = (
  workSchedule?: WorkSchedule,
  userId?: string
) => {
  const logger = useLogger('WorkScheduleLogger');
  
  // Log schedule information when it changes for debugging
  useEffect(() => {
    if (workSchedule) {
      logger.debug(`Using work schedule for TOIL calculation:`, {
        name: workSchedule.name,
        id: workSchedule.id,
        isDefault: workSchedule.isDefault,
        weeks: Object.keys(workSchedule.weeks).length > 0 ? 'available' : 'empty',
        rdoDays: Object.keys(workSchedule.rdoDays).length > 0 ? 'available' : 'empty'
      });
    } else if (userId) {
      logger.warn(`No work schedule provided for user ${userId} - TOIL calculation may be incorrect`);
    }
  }, [workSchedule, userId, logger]);
};
