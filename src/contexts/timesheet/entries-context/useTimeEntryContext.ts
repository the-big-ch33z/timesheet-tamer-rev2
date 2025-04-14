
import { useContext } from 'react';
import { TimeEntryContext } from './TimeEntryProvider';
import { TimeEntryContextValue } from './types';

export const useTimeEntryContext = (): TimeEntryContextValue => {
  const context = useContext(TimeEntryContext);
  if (!context) {
    throw new Error('useTimeEntryContext must be used within a TimeEntryProvider');
  }
  return context;
};
