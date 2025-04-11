
import { auditService } from '@/services/auditService';
import { syncService } from '@/services/syncService';
import { AuthStateType } from '../AuthProvider';
import { useToast } from '@/hooks/use-toast';

export const createUserStatusOperations = (state: AuthStateType, toast: ReturnType<typeof useToast>) => {
  const archiveUser = async (userId: string): Promise<void> => {
    try {
      if (!state.currentUser || state.currentUser.role !== 'admin') {
        throw new Error("Only admins can archive users");
      }
      
      const targetUser = state.users.find(u => u.id === userId);
      if (!targetUser) {
        throw new Error("User not found");
      }
      
      if (targetUser.id === state.currentUser.id) {
        throw new Error("You cannot archive your own account");
      }
      
      const updatedUser = { 
        ...targetUser, 
        status: 'archived' as const,
        updatedAt: new Date().toISOString()
      };
      
      state.setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? updatedUser : u)
      );
      
      await auditService.logEvent(
        state.currentUser.id,
        'archive_user',
        `user/${targetUser.id}`,
        `Archived user ${targetUser.name}`
      );
      
      await syncService.recordSync('users', 'success', 1);
      
      toast.toast({
        title: "User archived",
        description: `${targetUser.name} has been archived`,
      });
    } catch (error) {
      toast.toast({
        title: "Failed to archive user",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const restoreUser = async (userId: string): Promise<void> => {
    try {
      if (!state.currentUser || state.currentUser.role !== 'admin') {
        throw new Error("Only admins can restore users");
      }
      
      const targetUser = state.users.find(u => u.id === userId);
      if (!targetUser) {
        throw new Error("User not found");
      }
      
      const updatedUser = { 
        ...targetUser, 
        status: 'active' as const,
        updatedAt: new Date().toISOString()
      };
      
      state.setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? updatedUser : u)
      );
      
      await auditService.logEvent(
        state.currentUser.id,
        'restore_user',
        `user/${targetUser.id}`,
        `Restored user ${targetUser.name}`
      );
      
      await syncService.recordSync('users', 'success', 1);
      
      toast.toast({
        title: "User restored",
        description: `${targetUser.name} has been restored to active status`,
      });
    } catch (error) {
      toast.toast({
        title: "Failed to restore user",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const permanentDeleteUser = async (userId: string): Promise<void> => {
    try {
      if (!state.currentUser || state.currentUser.role !== 'admin') {
        throw new Error("Only admins can permanently delete users");
      }
      
      const targetUser = state.users.find(u => u.id === userId);
      if (!targetUser) {
        throw new Error("User not found");
      }
      
      if (targetUser.id === state.currentUser.id) {
        throw new Error("You cannot delete your own account");
      }
      
      if (targetUser.status !== 'archived') {
        throw new Error("User must be archived before permanent deletion");
      }
      
      const userMemberships = state.teamMemberships.filter(
        membership => membership.userId === userId
      );
      
      for (const membership of userMemberships) {
        state.setTeamMemberships(prevMemberships => 
          prevMemberships.filter(m => !(m.userId === userId && m.teamId === membership.teamId))
        );
      }
      
      state.setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      
      await auditService.logEvent(
        state.currentUser.id,
        'delete_user',
        `user/${targetUser.id}`,
        `Permanently deleted user ${targetUser.name}`
      );
      
      await syncService.recordSync('users', 'success', 1);
      await syncService.recordSync('teamMemberships', 'success', userMemberships.length);
      
      toast.toast({
        title: "User deleted",
        description: `${targetUser.name} has been permanently deleted`,
      });
    } catch (error) {
      toast.toast({
        title: "Failed to delete user",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    archiveUser,
    restoreUser,
    permanentDeleteUser
  };
};
