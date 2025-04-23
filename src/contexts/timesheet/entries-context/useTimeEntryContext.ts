
import { useContext } from 'react';
import { EntryDataContext } from './EntryDataContext';
import { EntryOperationsContext } from './EntryOperationsContext';
import { TimeEntryContextValue } from './types';

/**
 * A unified hook that combines data and operations from the split contexts
 * for backward compatibility with existing components.
 */
export const useTimeEntryContext = (): TimeEntryContextValue => {
  const dataContext = useContext(EntryDataContext);
  const operationsContext = useContext(EntryOperationsContext);
  
  if (!dataContext) {
    throw new Error('useTimeEntryContext must be used within an EntryDataContext.Provider');
  }
  
  if (!operationsContext) {
    throw new Error('useTimeEntryContext must be used within an EntryOperationsContext.Provider');
  }
  
  // Combine both contexts into one value for backward compatibility
  return {
    ...dataContext,
    ...operationsContext
  };
};
