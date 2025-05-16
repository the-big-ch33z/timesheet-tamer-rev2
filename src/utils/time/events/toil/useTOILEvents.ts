
import { useContext } from 'react';
import { TOILEventContext } from './TOILEventProvider';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useTOILEvents');

/**
 * Hook to access TOIL event context
 */
export const useTOILEvents = () => {
  const context = useContext(TOILEventContext);
  if (!context) {
    // Instead of throwing an error, return a default implementation
    logger.warn('useTOILEvents called outside of TOILEventProvider, using fallback');
    return {
      dispatchTOILEvent: () => false,
      subscribe: () => () => {},
      lastEvent: null
    };
  }
  return context;
};
