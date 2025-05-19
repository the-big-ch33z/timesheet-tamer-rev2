
import { useCallback } from 'react';
import { TimeEntry } from '@/types';
import { TOIL_JOB_NUMBER } from '@/utils/time/services/toil';
import { UseTOILEntryCheckerResult } from './types';

/**
 * Hook to check if an entry is a TOIL usage entry
 */
export const useToilEntryChecker = (): UseTOILEntryCheckerResult => {
  // Check if an entry is a TOIL usage entry
  const isToilEntry = useCallback((entry: TimeEntry): boolean => {
    return entry.jobNumber === TOIL_JOB_NUMBER;
  }, []);

  return { isToilEntry };
};
