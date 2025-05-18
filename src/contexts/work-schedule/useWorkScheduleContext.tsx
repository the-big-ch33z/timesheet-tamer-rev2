import React, { useState, useEffect } from 'react';
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
  const { updateUserMetrics, setUsers } = useAuth(); // pull in setUsers for local user state update
  
  const storageOps = createStorageOperations();
  
  const [state, setState] = useState<WorkScheduleState>(() => ({
    defaultSchedule: storageOps.loadSchedules().find(s => s.isDefault) || defaultWorkSchedule,
    schedules: storageOps.loadSchedules(),
    userSchedules: storageOps.loadUserSchedules()
  }));

  useEffect(() => {
    storageOps.saveSchedules(state.schedules);
    clearAllScheduleCache();
    timeEventsService.publish('schedules-updated', {
      scheduleCount: state.schedules.length,
      timestamp: Date.now(),
    });
  }, [state.schedules]);

  useEffect(() => {
    storageOps.saveUserSchedules(state.userSchedules);
    timeEventsService.publish('user-schedules-updated', {
      userCount: Object.keys(state.userSchedules).length,
      timestamp: Date.now(),
    });
  }, [state.userSchedules]);

  // ✅ Enhanced: Helper function to update user's workScheduleId property and local state
  const updateUserWorkScheduleId = async (userId: string, scheduleId: string) => {
    try {
      console.log(`Updating user ${userId} workScheduleId to ${scheduleId}`);
      
      await updateUserMetrics(userId, {
        workScheduleId: scheduleId
      });

      // Also update local user object if setUsers is available
      if (setUsers) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId
              ? { ...user, workScheduleId: scheduleId }
              : user
          )
        );
      }

      console.log(`Successfully updated user ${userId} workScheduleId to ${scheduleId}`);
    } catch (error) {
      console.error("Error updating user workScheduleId:", error);
      throw error;
    }
  };

  const scheduleOps = createScheduleOperations(state, setState, toast);

  const userScheduleOps = createUserScheduleOperations({
    state,
    setState,
    updateUserWorkScheduleId,
    toast
  });

  const handleDeleteSchedule = (scheduleId: string) => {
    if (scheduleId === 'default') {
      toast({
        title: 'Cannot delete default schedule',
        description: 'The default schedule cannot be deleted',
        variant: 'destructive',
      });
      return;
    }

    setState(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => s.id !== scheduleId)
    }));

    const affectedUsers = Object.entries(state.userSchedules)
      .filter(([_, sId]) => sId === scheduleId)
      .map(([userId]) => userId);

    if (affectedUsers.length > 0) {
      const newUserSchedules = { ...state.userSchedules };
      affectedUsers.forEach(userId => {
        delete newUserSchedules[userId];
        updateUserWorkScheduleId(userId, 'default');
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
