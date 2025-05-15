
import { useState } from 'react';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { useWorkHoursCore } from './work-hours/useWorkHoursCore';
import { useWorkHoursActions } from './work-hours/useWorkHoursActions';
import { useWorkHoursCalculation } from './work-hours/useWorkHoursCalculation';
import { useWorkHoursSaving } from './work-hours/useWorkHoursSaving';
import { useWorkHoursUtilities } from './work-hours/useWorkHoursUtilities';
import { UseWorkHoursOptions, UseWorkHoursReturn } from './types/workHoursTypes';

/**
 * Comprehensive hook for work hours management
 * 
 * This is the main hook for working with work hours in the application.
 * It combines all functionality from different specialized hooks into one unified API.
 * 
 * @param options - Optional configuration object
 * @returns Combined work hours functionality
 */

const logger = createTimeLogger('useWorkHours');

export type { UseWorkHoursOptions, UseWorkHoursReturn };

export const useWorkHours = (options: UseWorkHoursOptions = {}): UseWorkHoursReturn => {
  // Use our specialized hooks
  const {
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    calculatedHours,
    setCalculatedHours,
    isProcessingSave,
    setIsProcessingSave,
    getWorkHoursForDate,
    saveWorkHoursForDate,
    resetWorkHoursForDate,
    refreshWorkHours,
    toast
  } = useWorkHoursCore(options);

  const {
    actionStates,
    handleToggleAction
  } = useWorkHoursActions(options);

  const {
    calculateDayHours,
    calculateAutoHours
  } = useWorkHoursCalculation(
    startTime,
    endTime,
    options,
    setCalculatedHours,
    options.formHandlers
  );

  const {
    handleTimeChange
  } = useWorkHoursSaving(
    startTime,
    endTime,
    options,
    setStartTime,
    setEndTime,
    isProcessingSave,
    setIsProcessingSave,
    saveWorkHoursForDate
  );

  const {
    hasCustomHours,
    resetWorkHours,
    clearAllWorkHours,
    getWorkHoursStats,
    getWorkHoursForDateWithCalculated
  } = useWorkHoursUtilities(
    { 
      ...options, 
      getWorkHoursForDate,
      resetWorkHoursForDate,
      refreshWorkHours 
    },
    calculateAutoHours
  );

  // Get entry stats
  const { totalEnteredHours, hasEntries, hoursVariance, isUndertime } = getWorkHoursStats();

  // Return the combined API
  return {
    // Basic state
    startTime,
    endTime,
    calculatedHours,
    
    // Time entry states
    totalEnteredHours,
    hasEntries,
    hoursVariance,
    isUndertime,
    
    // Action states
    actionStates,
    
    // Handlers
    handleTimeChange,
    handleToggleAction,
    
    // Core work hours API
    getWorkHoursForDate: getWorkHoursForDateWithCalculated,
    saveWorkHoursForDate,
    resetWorkHours,
    refreshWorkHours,
    
    // Calculation methods
    calculateAutoHours,
    calculateDayHours,
    
    // Utils
    hasCustomHours,
    clearAllWorkHours
  };
};

export default useWorkHours;
