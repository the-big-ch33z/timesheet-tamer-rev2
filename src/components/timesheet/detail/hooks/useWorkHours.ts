
/**
 * @fileoverview Re-export of useWorkHours from the centralized location
 * This file is kept for backward compatibility with existing component imports
 */

import { useWorkHours as useWorkHoursCentralized, UseWorkHoursOptions } from '@/hooks/timesheet/useWorkHours';
import { deprecationWarning } from '@/utils/deprecation/deprecationWarnings';

/**
 * @deprecated Please import useWorkHours from '@/hooks/timesheet/useWorkHours' instead
 */
export const useWorkHours = (options: UseWorkHoursOptions = {}) => {
  // Show a deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    deprecationWarning(
      'useWorkHours (component hook)',
      'This import location is deprecated. Please import from @/hooks/timesheet/useWorkHours instead.'
    );
  }
  
  return useWorkHoursCentralized(options);
};

export default useWorkHours;
