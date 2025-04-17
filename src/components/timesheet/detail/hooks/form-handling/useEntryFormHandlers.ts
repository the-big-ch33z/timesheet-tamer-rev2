
import { useEffect, useCallback } from 'react';
import { useTimeEntryForm } from '@/hooks/timesheet/useTimeEntryForm';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';

const logger = createTimeLogger('useEntryFormHandlers');

interface UseEntryFormHandlersProps {
  date: Date;
  userId: string;
  maxFixedHandlers?: number;
  maxEmptyHandlers?: number;
  interactive?: boolean;
  startTime?: string;
  endTime?: string;
}

/**
 * Hook to create fixed form handlers that comply with React's rules of hooks
 */
export const useEntryFormHandlers = ({
  date,
  userId,
  maxFixedHandlers = 5,
  maxEmptyHandlers = 3,
  interactive = true,
  startTime = '09:00',
  endTime = '17:00'
}: UseEntryFormHandlersProps) => {
  
  // Generate a series of fixed handlers for existing entries
  // These will always be created in the same order regardless of data
  const handler1 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    formKey: `entry-fixed-1`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  const handler2 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    formKey: `entry-fixed-2`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  const handler3 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    formKey: `entry-fixed-3`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  const handler4 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    formKey: `entry-fixed-4`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  const handler5 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    formKey: `entry-fixed-5`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  // Combine all fixed handlers into an array
  const fixedHandlers = [handler1, handler2, handler3, handler4, handler5];
  
  // Create handlers for new entries
  const newHandler1 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    initialData: { startTime, endTime },
    formKey: `new-entry-1`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  const newHandler2 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    initialData: { startTime, endTime },
    formKey: `new-entry-2`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  const newHandler3 = useTimeEntryForm({
    selectedDate: date,
    userId: userId || '',
    initialData: { startTime, endTime },
    formKey: `new-entry-3`,
    autoSave: false,
    disabled: !interactive,
    autoCalculateHours: true
  });
  
  // Combine empty handlers
  const emptyHandlers = [newHandler1, newHandler2, newHandler3];
  
  // Log handler initialization
  useEffect(() => {
    logger.debug(`[useEntryFormHandlers] Created ${fixedHandlers.length} fixed handlers and ${emptyHandlers.length} empty handlers`);
  }, [fixedHandlers.length, emptyHandlers.length]);
  
  // Return all handlers
  return {
    fixedHandlers,
    emptyHandlers
  };
};
