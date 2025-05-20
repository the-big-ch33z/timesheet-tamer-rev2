
import { useState, useEffect, useCallback } from 'react';
import { toilService } from '@/utils/time/services/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { unifiedTOILEventService } from '@/utils/time/services/toil/unifiedEventService';

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
    }
  }, [entries.length, entriesCount]);

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
        
        // Use the unified service to dispatch events
        if (summary) {
          unifiedTOILEventService.dispatchTOILSummaryEvent(summary);
        }
      }).catch(error => {
        logger.error('[useTOILTriggers] Error in manual TOIL calculation:', error);
        
        // Use unified service to report error
        unifiedTOILEventService.dispatchTOILErrorEvent(
          'Error in manual TOIL calculation',
          error,
          userId
        );
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
