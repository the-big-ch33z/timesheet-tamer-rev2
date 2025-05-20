import { useState, useCallback } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { createTimeLogger } from '@/utils/time/errors';
import { useTOILCalculations } from './useTOILCalculations';
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS } from '@/utils/events/eventTypes';
import { unifiedTOILEventService } from '@/utils/time/services/toil/unifiedEventService';

const logger = createTimeLogger('useTOILTriggers');

interface UseTOILTriggersProps {
  userId: string;
  date: Date;
  entries: TimeEntry[];
  workSchedule?: WorkSchedule;
  holidays: any[];
}

/**
 * @deprecated Use useUnifiedTOIL from '@/hooks/timesheet/toil/useUnifiedTOIL' instead
 */
export const useTOILTriggers = ({
  userId,
  date,
  entries,
  workSchedule,
  holidays
}: UseTOILTriggersProps) => {
  logger.debug('useTOILTriggers is deprecated. Use useUnifiedTOIL instead');
  
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
      // Notify that calculation is starting
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date,
        status: 'starting',
        timestamp: new Date()
      });
      
      const result = await calculateToilForDay();
      
      // Notify that calculation is complete using the unified service
      if (result) {
        unifiedTOILEventService.dispatchTOILSummaryEvent(result);
      }
      
      // Also publish the calculation completed event
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date,
        status: 'completed',
        summary: result,
        timestamp: new Date()
      });
      
      logger.debug('Manual TOIL calculation complete');
      return result;
    } catch (error) {
      logger.error('Error during manual TOIL calculation:', error);
      
      // Notify about error
      eventBus.publish(TOIL_EVENTS.CALCULATED, {
        userId,
        date,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
      
      throw error;
    } finally {
      setIsCalculating(false);
    }
  }, [calculateToilForDay, userId, date]);

  return {
    triggerTOILCalculation,
    isCalculating
  };
};
