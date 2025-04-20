
import { TimeEntry } from '@/types';
import { calculateCompletion } from '@/utils/timesheet/completionUtils';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useTimeCompletion');

export const useTimeCompletion = (
  entries: TimeEntry[],
  startTime: string | null | undefined,
  endTime: string | null | undefined
) => {
  logger.debug(`Calculating completion for ${entries.length} entries`);
  return calculateCompletion(entries, startTime, endTime);
};
