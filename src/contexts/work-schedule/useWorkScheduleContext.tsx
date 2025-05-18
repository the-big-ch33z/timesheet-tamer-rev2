
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { defaultWorkSchedule } from './defaultSchedule';
import { createStorageOperations } from './storage-utils';
import { createScheduleOperations } from './schedule-operations';
import { createUserScheduleOperations, clearAllScheduleCache } from './user-schedule-operations';
import { WorkScheduleState } from './internal-types';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

/**
 * Core implementation of the WorkSchedule context
 * This hook manages work schedules and provides operations to manipulate them.
 * 
 * Integration with other parts of the system:
 * 1. Dispatches events when schedules change (for WorkHoursContext to respond)
 * 2. Provides utilities for deriving time information from schedules
 * 3. Syncs schedule data to localStorage for persistence
 */
export function useWorkScheduleContext() {
  const { toast } = useToast();
  const { updateUserMetrics } = useAuth();
  
  // Set up storage operations
  const storageOps = createStorageOperations();
  
  // Initialize state from localStorage
  const [state, setState] = useState<WorkScheduleState>(() => ({
    defaultSchedule: storageOps.loadSchedules().find(s => s.isDefault) || defaultWorkSchedule,
    schedules: storageOps.loadSchedules(),
    userSchedules: storageOps.loadUserSchedules()
  }));

  // Save schedules to localStorage whenever they change
  useEffect(() => {
    storageOps.saveSchedules(state.schedules);
    
    // Clear all schedule caches when schedules change
    clearAllScheduleCache();
    
    // Publish an event when schedules change so other contexts can react
    timeEventsService.publish('schedules-updated', {
      scheduleCount: state.schedules.length,
      timestamp: Date.now(),
    });
  }, [state.schedules]);

  // Save user schedules to localStorage whenever they change
  useEffect(() => {
    storageOps.saveUserSchedules(state.userSchedules);
    
    // Publish an event when user schedules change
    timeEventsService.publish('user-schedules-updated', {
      userCount: Object.keys(state.userSchedules).length,
      timestamp: Date.now(),
    });
  }, [state.userSchedules]);

  // Helper function to update user's workScheduleId property
  const updateUserWorkScheduleId = async (userId: string, scheduleId: string) => {
    try {
      console.log(`Updating user ${userId} workScheduleId to ${scheduleId}`);
      
      // Use the existing auth context to update user data
      await updateUserMetrics(userId, {
        // Pass the scheduleId directly - fixed to ensure it's a string value
        workScheduleId: scheduleId
      });
      
      console.log(`Successfully updated user ${userId} workScheduleId to ${scheduleId}`);
    } catch (error) {
      console.error("Error updating user workScheduleId:", error);
      throw error;
    }
  };

  // Set up schedule operations
  const scheduleOps = createScheduleOperations(state, setState, toast);

  // Set up user schedule operations
  const userScheduleOps = createUserScheduleOperations({
    state,
    setState,
    updateUserWorkScheduleId,
    toast
  });

  // Cleanup and remove users from userSchedules when their schedules are deleted
  const handleDeleteSchedule = (scheduleId: string) => {
    if (scheduleId === 'default') {
      toast({
        title: 'Cannot delete default schedule',
        description: 'The default schedule cannot be deleted',
        variant: 'destructive',
      });
      return;
    }
    
    // Remove from schedules
    setState(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => s.id !== scheduleId)
    }));
    
    // Update any users using this schedule to default
    const affectedUsers = Object.entries(state.userSchedules)
      .filter(([_, sId]) => sId === scheduleId)
      .map(([userId]) => userId);
    
    if (affectedUsers.length > 0) {
      const newUserSchedules = { ...state.userSchedules };
      affectedUsers.forEach(userId => {
        delete newUserSchedules[userId];
        
        // Update user objects to reflect this change
        updateUserWorkScheduleId(userId, 'default');
        
        // Publish event for each affected user
        timeEventsService.publish('user-schedule-changed', {
          userId,
          oldScheduleId: scheduleId,
          newScheduleId: 'default',
          timestamp: Date.now()
        });
      });
      
      setState(prev => ({
        ...prev,
        userSchedules: newUserSchedules
      }));
      
      toast({
        title: 'Schedule deleted',
        description: `Schedule deleted and ${affectedUsers.length} users reset to default schedule`,
      });
    } else {
      toast({
        title: 'Schedule deleted',
        description: 'The schedule has been deleted successfully',
      });
    }

    // Clear all schedule caches when a schedule is deleted
    clearAllScheduleCache();
  };

  return {
    defaultSchedule: state.defaultSchedule,
    schedules: state.schedules,
    userSchedules: state.userSchedules,
    updateDefaultSchedule: scheduleOps.updateDefaultSchedule,
    createSchedule: scheduleOps.createSchedule,
    updateSchedule: scheduleOps.updateSchedule,
    deleteSchedule: handleDeleteSchedule,
    getScheduleById: scheduleOps.getScheduleById,
    assignScheduleToUser: userScheduleOps.assignScheduleToUser,
    getUserSchedule: userScheduleOps.getUserSchedule,
    resetUserSchedule: userScheduleOps.resetUserSchedule,
    getAllSchedules: scheduleOps.getAllSchedules
  };
}
