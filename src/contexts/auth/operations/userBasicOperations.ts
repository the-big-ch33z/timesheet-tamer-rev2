
import { User, UserRole } from '@/types';
import { auditService } from '@/services/auditService';
import { syncService } from '@/services/syncService';
import { AuthStateType } from '../AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { USER_DEFAULTS } from '@/constants/defaults';

export const createUserBasicOperations = (state: AuthStateType, toastApi: ReturnType<typeof useToast>) => {
  const { toast } = toastApi;
  
  const getUsersByRole = (role: UserRole) => {
    return state.users.filter(user => user.role === role);
  };

  const getUserById = (userId: string) => {
    return state.users.find(user => user.id === userId);
  };

  const getUsersByTeam = (teamId: string) => {
    const membershipIds = state.teamMemberships
      .filter(membership => membership.teamId === teamId)
      .map(membership => membership.userId);
      
    return state.users.filter(user => membershipIds.includes(user.id));
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
    try {
      if (!state.currentUser || state.currentUser.role !== 'admin') {
        throw new Error("Only admins can update user roles");
      }
      
      const targetUser = state.users.find(u => u.id === userId);
      if (!targetUser) {
        throw new Error("User not found");
      }
      
      const updatedUser = { 
        ...targetUser, 
        role: newRole,
        updatedAt: new Date().toISOString()
      };
      
      state.setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? updatedUser : u)
      );
      
      if (state.currentUser.id === userId) {
        state.setCurrentUser(updatedUser);
      }
      
      await auditService.logEvent(
        state.currentUser.id,
        'update_role',
        `user/${targetUser.id}`,
        `Updated ${targetUser.name}'s role from ${targetUser.role} to ${newRole}`
      );
      
      await syncService.recordSync('users', 'success', 1);
      
      toast({
        title: "Role updated",
        description: `${targetUser.name}'s role has been updated to ${newRole}`,
      });
    } catch (error) {
      toast({
        title: "Failed to update role",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUserMetrics = async (userId: string, metrics: { fte?: number; fortnightHours?: number; workScheduleId?: string }): Promise<void> => {
    try {
      console.log(`Updating user ${userId} metrics:`, metrics);
      
      // Find the target user
      const userIndex = state.users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error("User not found");
      }
      
      // Create a copy of the user object
      const updatedUser = {
        ...state.users[userIndex],
        updatedAt: new Date().toISOString()
      };
      
      // Only update the fields that are provided, using explicit checks
      if (metrics.fte !== undefined) {
        // Ensure we store a valid number
        updatedUser.fte = !isNaN(metrics.fte) ? metrics.fte : USER_DEFAULTS.FTE;
        console.log(`Setting FTE to ${updatedUser.fte} for user ${userId}`);
      }
      
      if (metrics.fortnightHours !== undefined) {
        // Ensure we store a valid number
        updatedUser.fortnightHours = !isNaN(metrics.fortnightHours) ? metrics.fortnightHours : USER_DEFAULTS.FORTNIGHT_HOURS;
        console.log(`Setting fortnightHours to ${updatedUser.fortnightHours} for user ${userId}`);
      }
      
      if (metrics.workScheduleId !== undefined) {
        // Always store workScheduleId as a string, even if it's 'default'
        updatedUser.workScheduleId = String(metrics.workScheduleId);
        console.log(`Updated workScheduleId to ${updatedUser.workScheduleId}`);
      }
      
      console.log("Updated user object:", updatedUser);
      
      // Update the users array with the new user object
      const newUsers = [...state.users];
      newUsers[userIndex] = updatedUser;
      
      // Force a state change by creating a new array
      state.setUsers([...newUsers]);
      
      // If updating the current user, update currentUser state as well
      if (state.currentUser && state.currentUser.id === userId) {
        state.setCurrentUser({...updatedUser});
        console.log("Updated current user state with new metrics");
      }
      
      await auditService.logEvent(
        state.currentUser?.id || 'system',
        'update_user_metrics',
        `user/${userId}`,
        `User metrics updated: FTE=${metrics.fte}, Fortnight Hours=${metrics.fortnightHours}, Work Schedule=${metrics.workScheduleId}`
      );
      
      // Add a notification about the successful update
      toast({
        title: "User metrics updated",
        description: `Updated user settings successfully`,
      });
      
    } catch (error) {
      console.error("Error updating user metrics:", error);
      toast({
        title: "Failed to update user metrics",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    getUsersByRole,
    getUserById,
    getUsersByTeam,
    updateUserRole,
    updateUserMetrics
  };
};
