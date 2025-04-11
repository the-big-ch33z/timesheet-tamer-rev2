
import { User, UserRole } from '@/types';
import { auditService } from '@/services/auditService';
import { syncService } from '@/services/syncService';
import { AuthStateType } from '../AuthProvider';
import { useToast } from '@/hooks/use-toast';

export const createUserBasicOperations = (state: AuthStateType, toast: ReturnType<typeof useToast>) => {
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
      
      toast.toast({
        title: "Role updated",
        description: `${targetUser.name}'s role has been updated to ${newRole}`,
      });
    } catch (error) {
      toast.toast({
        title: "Failed to update role",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUserMetrics = async (userId: string, metrics: { fte?: number; fortnightHours?: number }): Promise<void> => {
    try {
      const userIndex = state.users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error("User not found");
      }
      
      const updatedUser = {
        ...state.users[userIndex],
        fte: metrics.fte ?? state.users[userIndex].fte,
        fortnightHours: metrics.fortnightHours ?? state.users[userIndex].fortnightHours,
        updatedAt: new Date().toISOString()
      };
      
      const newUsers = [...state.users];
      newUsers[userIndex] = updatedUser;
      state.setUsers(newUsers);
      
      await auditService.logEvent(
        state.currentUser?.id || 'system',
        'update_user_metrics',
        `user/${userId}`,
        `User metrics updated: FTE=${metrics.fte}, Fortnight Hours=${metrics.fortnightHours}`
      );
      
    } catch (error) {
      console.error("Error updating user metrics:", error);
      toast.toast({
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
