
import { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkHoursContext } from '@/contexts/timesheet/work-hours-context/WorkHoursContext';
import { useEntries } from './useEntries';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { useToast } from '@/hooks/use-toast';
import { UseWorkHoursOptions } from '../types/workHoursTypes';
import { workHoursStorage } from '@/contexts/timesheet/work-hours-context/workHoursStorage';

const logger = createTimeLogger('useWorkHoursCore');

/**
 * Core hook for work hours management
 * Handles the basic state and data fetching with optimized storage
 */
export const useWorkHoursCore = (options: UseWorkHoursOptions = {}) => {
  const { date, userId, interactive = true } = options;
  const { toast } = useToast();
  const { getWorkHoursForDate, saveWorkHours, clearWorkHours, refreshWorkHours } = useWorkHoursContext();

  // Local state management
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [calculatedHours, setCalculatedHours] = useState<number>(0);
  const [isProcessingSave, setIsProcessingSave] = useState<boolean>(false);
  
  // Optimization: Use a ref to avoid excessive renders for date formatting
  const dateStringRef = useRef<string>('');
  if (date) {
    dateStringRef.current = format(date, 'yyyy-MM-dd');
  }

  // Get entries for the work day
  const entries = useEntries(options);
  
  // Initialize the state once and on reference changes using useCallback for performance
  const initializeState = useCallback(() => {
    if (!date || !userId) {
      logger.debug('Missing date or userId, skipping initialization');
      return;
    }
    
    try {
      // Get work hours data
      const data = getWorkHoursForDate(date, userId);
      
      // Set state based on retrieved data
      setStartTime(data.startTime || '');
      setEndTime(data.endTime || '');
      
      logger.debug(`Initialized state for ${format(date, 'yyyy-MM-dd')}, user ${userId}`);
    } catch (error) {
      logger.error('Error initializing work hours state:', error);
      toast({
        title: 'Error Loading Hours',
        description: 'Could not load work hours data. Please refresh the page.',
        variant: 'destructive'
      });
    }
  }, [date, userId, getWorkHoursForDate, toast]);

  // Sync with unload to ensure data is saved
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force synchronization of any pending work hours data
      workHoursStorage.forceSync();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Initialize state when required props change
  useEffect(() => {
    initializeState();
  }, [initializeState]);

  // Expose storage operations as functions
  const getWorkHoursForCurrentDate = useCallback(() => {
    if (!date || !userId) {
      logger.warn('Missing date or userId for getWorkHoursForCurrentDate');
      return { startTime: '', endTime: '', isCustom: false };
    }
    
    return getWorkHoursForDate(date, userId);
  }, [date, userId, getWorkHoursForDate]);

  const saveWorkHoursForDate = useCallback((
    targetDate: Date, 
    newStartTime: string, 
    newEndTime: string,
    targetUserId?: string
  ) => {
    const effectiveUserId = targetUserId || userId;
    
    if (!effectiveUserId) {
      logger.warn('No userId provided for saveWorkHoursForDate');
      return;
    }
    
    try {
      saveWorkHours(targetDate, effectiveUserId, newStartTime, newEndTime);
    } catch (error) {
      logger.error('Error in saveWorkHoursForDate:', error);
      toast({
        title: 'Error Saving',
        description: 'Could not save your time changes. Please try again.',
        variant: 'destructive'
      });
    }
  }, [saveWorkHours, userId, toast]);

  const resetWorkHoursForDate = useCallback((targetDate: Date, targetUserId: string) => {
    try {
      const dateStr = format(targetDate, 'yyyy-MM-dd');
      logger.debug(`Resetting work hours for ${dateStr}, user ${targetUserId}`);
      
      // Save with empty values to reset 
      saveWorkHours(targetDate, targetUserId, '', '');
      
      // Reset local state if it's for the current date/user
      if (date && userId && 
          format(date, 'yyyy-MM-dd') === dateStr && 
          userId === targetUserId) {
        setStartTime('');
        setEndTime('');
        setCalculatedHours(0);
      }
      
      return true;
    } catch (error) {
      logger.error('Error in resetWorkHoursForDate:', error);
      return false;
    }
  }, [date, userId, saveWorkHours]);

  // Return the state and functions
  return {
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    calculatedHours,
    setCalculatedHours,
    isProcessingSave,
    setIsProcessingSave,
    getWorkHoursForDate: getWorkHoursForCurrentDate,
    saveWorkHoursForDate,
    resetWorkHoursForDate,
    refreshWorkHours,
    toast
  };
};
