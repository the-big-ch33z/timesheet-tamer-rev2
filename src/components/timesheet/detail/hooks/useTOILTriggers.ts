
import { useState, useEffect, useCallback } from 'react';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { toilService } from '@/utils/time/services/toil';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useTOILTriggers');

interface UseTOILTriggersProps {
  userId: string;
  date: Date;
  entries: any[];
  workSchedule: any;
  holidays: any[];
}

export const useTOILTriggers = ({
  userId,
  date,
  entries,
  workSchedule,
  holidays
}: UseTOILTriggersProps) => {
  const [manualCalculationTrigger, setManualCalculationTrigger] = useState(0);
  const [entriesCount, setEntriesCount] = useState(entries.length);

  // Handle entries count changes
  useEffect(() => {
    if (entries.length !== entriesCount) {
      logger.debug(`[useTOILTriggers] Entries count changed from ${entriesCount} to ${entries.length}`);
      setEntriesCount(entries.length);

      // Publish event about hours change
      timeEventsService.publish('hours-updated', {
        entriesCount: entries.length,
        date: date.toISOString(),
        userId
      });
    }
  }, [entries.length, entriesCount, date, userId]);

  // Manual TOIL calculation trigger
  useEffect(() => {
    if (manualCalculationTrigger > 0 && workSchedule) {
      logger.debug('[useTOILTriggers] Manual TOIL calculation triggered');
      
      // Direct call to TOIL service for immediate calculation
      toilService.calculateAndStoreTOIL(
        entries,
        date,
        userId,
        workSchedule,
        holidays
      ).then(summary => {
        logger.debug('[useTOILTriggers] Manual TOIL calculation complete:', summary);
        
        // Dispatch both event types for maximum compatibility
        timeEventsService.publish('toil-updated', {
          userId,
          date: date.toISOString(),
          summary
        });
        
        // Also dispatch through the DOM event system
        window.dispatchEvent(new CustomEvent('toil:summary-updated', { 
          detail: summary
        }));
      });
    }
  }, [manualCalculationTrigger, entries, date, userId, workSchedule, holidays]);

  const triggerTOILCalculation = useCallback(() => {
    setManualCalculationTrigger(prev => prev + 1);
  }, []);

  return {
    entriesCount,
    triggerTOILCalculation
  };
};
