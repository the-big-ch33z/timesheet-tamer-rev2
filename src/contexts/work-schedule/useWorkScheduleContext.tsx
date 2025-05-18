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
 */
export function useWorkScheduleContext() {
  const { toast } = useToast();
  const { updateUserMetrics, users } = useAuth();
  
  // Set up storage operations
  const storageOps = createStorageOperations();
  
  // Initialize state from localStorage and build userSchedules from users array
  const [state, setState] = useState<WorkScheduleState>(() => {
    // First load schedules from localStorage - this ensures default schedule exists
    const schedules = storageOps.loadSchedules();
    
    // Ensure default schedule exists and has isDefault=true
    const defaultSchedule = schedules.find(s => s.id === 'default') || {
      ...defaultWorkSchedule,
      isDefault: true
    };
    
    // Load saved user schedules with validation
    const savedUserSchedules = storageOps.loadUserSchedules();
    
    // Build userSchedules from users' workScheduleId properties
    // This makes it a derived cache from the source of truth
    const userSchedules: Record<string, string> = {};
    if (users) {
      users.forEach(user => {
        if (user.workScheduleId && user.workScheduleId !== 'default') {
          // Only add valid string scheduleIds
          if (typeof user.workScheduleId === 'string') {
            userSchedules[user.id] = user.workScheduleId;
          }
        }
      });
    }
    
    // Merge saved schedules with those from users, prioritizing user data
    const mergedUserSchedules = { ...savedUserSchedules, ...userSchedules };
    
    console.log("Initialized WorkScheduleContext with:", {
      scheduleCount: schedules.length,
      userScheduleCount: Object.keys(mergedUserSchedules).length
    });
    
    return {
      defaultSchedule,
      schedules,
      userSchedules: mergedUserSchedules
    };
  });

  // Effect to rebuild userSchedules whenever users array changes
  // This ensures our cache stays in sync with the source of truth
  useEffect(() => {
    if (!users || users.length === 0) return;
    
    const userSchedules: Record<string, string> = {};
    users.forEach(user => {
      if (user.workScheduleId && user.workScheduleId !== 'default') {
        // Only add valid string scheduleIds
        if (typeof user.workScheduleId === 'string') {
          userSchedules[user.id] = user.workScheduleId;
        }
      }
    });
    
    // Only update if there are actual changes to prevent loops
    const hasChanges = JSON.stringify(userSchedules) !== JSON.stringify(state.userSchedules);
    if (hasChanges) {
      console.log("Rebuilding userSchedules cache from users array");
      setState(prev => ({
        ...prev,
        userSchedules
      }));
    }
  }, [users]);

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
  // This is the PRIMARY source of truth for schedule assignment
  const updateUserWorkScheduleId = async (userId: string, scheduleId: string) => {
    try {
      console.log(`Updating user ${userId} workScheduleId to ${scheduleId}`);
      
      // We must always ensure scheduleId is a string
      const scheduleIdString = String(scheduleId);
      
      // Use the existing auth context to update user data
      await updateUserMetrics(userId, {
        // Pass the scheduleId directly - ensuring it's a string value
        workScheduleId: scheduleIdString
      });
      
      console.log(`Successfully updated user ${userId} workScheduleId to ${scheduleId}`);
      
      // Publish event for each affected user
      timeEventsService.publish('user-schedule-changed', {
        userId,
        newScheduleId: scheduleId,
        timestamp: Date.now()
      });
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
    // We need to check both the userSchedules cache and users array
    const affectedUsers = Object.entries(state.userSchedules)
      .filter(([_, sId]) => sId === scheduleId)
      .map(([userId]) => userId);
    
    if (affectedUsers.length > 0) {
      const newUserSchedules = { ...state.userSchedules };
      
      Promise.all(affectedUsers.map(async (userId) => {
        // Update user object workScheduleId (source of truth)
        await updateUserWorkScheduleId(userId, 'default');
        
        // Update the cache
        delete newUserSchedules[userId];
        
        // Publish event for each affected user
        timeEventsService.publish('user-schedule-changed', {
          userId,
          oldScheduleId: scheduleId,
          newScheduleId: 'default',
          timestamp: Date.now()
        });
      }))
      .then(() => {
        // Update state after all users have been processed
        setState(prev => ({
          ...prev,
          userSchedules: newUserSchedules
        }));
        
        toast({
          title: 'Schedule deleted',
          description: `Schedule deleted and ${affectedUsers.length} users reset to default schedule`,
        });
      })
      .catch(error => {
        console.error("Error updating users during schedule deletion:", error);
        
        toast({
          title: 'Error updating users',
          description: 'The schedule was deleted but some users could not be updated',
          variant: 'destructive',
        });
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

  // Add a function to verify consistency between user objects and userSchedules
  const verifyUserScheduleConsistency = () => {
    if (!users) return { consistent: true, issues: [] };
    
    const issues: { userId: string, userName: string, issue: string }[] = [];
    
    // Check each user with a workScheduleId
    users.forEach(user => {
      if (user.workScheduleId && user.workScheduleId !== 'default') {
        // Verify workScheduleId is a string
        if (typeof user.workScheduleId !== 'string') {
          issues.push({
            userId: user.id,
            userName: user.name,
            issue: `User has invalid workScheduleId type: ${typeof user.workScheduleId}`
          });
          return;
        }
        
        // Should be in userSchedules
        if (!state.userSchedules[user.id]) {
          issues.push({
            userId: user.id,
            userName: user.name,
            issue: `User has workScheduleId ${user.workScheduleId} but is missing from userSchedules cache`
          });
        } else if (state.userSchedules[user.id] !== user.workScheduleId) {
          issues.push({
            userId: user.id,
            userName: user.name,
            issue: `Inconsistent scheduleId: User ${user.workScheduleId} vs Cache ${state.userSchedules[user.id]}`
          });
        }
      } else {
        // Should not be in userSchedules
        if (state.userSchedules[user.id]) {
          issues.push({
            userId: user.id,
            userName: user.name,
            issue: `User has no custom schedule but is in userSchedules cache with ${state.userSchedules[user.id]}`
          });
        }
      }
    });
    
    // Check for userIds in userSchedules that don't exist in users
    Object.keys(state.userSchedules).forEach(userId => {
      if (!users.some(user => user.id === userId)) {
        issues.push({
          userId,
          userName: 'Unknown User',
          issue: `userId in userSchedules cache does not exist in users array`
        });
      }
    });
    
    return {
      consistent: issues.length === 0,
      issues
    };
  };

  return {
    defaultSchedule: state.defaultSchedule,
    schedules: state.schedules,
    userSchedules: state.userSchedules,
    updateDefaultSchedule: scheduleOps.updateDefaultSchedule,
    createSchedule: scheduleOps.createSchedule,
    updateSchedule: scheduleOps.updateSchedule,
    deleteSchedule: scheduleOps.handleDeleteSchedule || ((id: string) => {}),
    getScheduleById: scheduleOps.getScheduleById,
    assignScheduleToUser: userScheduleOps.assignScheduleToUser,
    getUserSchedule: userScheduleOps.getUserSchedule,
    resetUserSchedule: userScheduleOps.resetUserSchedule,
    getAllSchedules: scheduleOps.getAllSchedules,
    verifyUserScheduleConsistency
  };
}
