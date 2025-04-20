
import { useContext } from 'react';
import { TimeEntryContext } from './TimeEntryProvider';
import { TimeEntryContextValue } from './types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useTimeEntryContext');

export const useTimeEntryContext = (): TimeEntryContextValue => {
  const context = useContext(TimeEntryContext);
  
  if (!context) {
    logger.error('useTimeEntryContext was called outside of a TimeEntryProvider');
    throw new Error('useTimeEntryContext must be used within a TimeEntryProvider');
  }
  
  logger.debug('TimeEntryContext accessed, entries count:', context.entries.length);
  
  return context;
};
