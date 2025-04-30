
import { useAuth } from '@/contexts/auth';
import { useRolePermission } from '@/hooks/useRolePermission';
import { User, Team } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

export function useTeamPermission() {
  const { currentUser, teams, getUsersByTeam, getTeamsByManager } = useAuth();
  const { isAdmin, isManager } = useRolePermission();
  const { toast } = useToast();
  
  /**
   * Check if the current user can manage the specified team
   */
  const canManageTeam = useCallback((teamId: string): boolean => {
    // Admins can manage all teams
    if (isAdmin()) return true;
    
    // Managers can only manage their own teams
    if (isManager() && currentUser) {
      const managedTeams = getTeamsByManager(currentUser.id);
      return managedTeams.some(team => team.id === teamId);
    }
    
    return false;
  }, [currentUser, isAdmin, isManager, getTeamsByManager]);
  
  /**
   * Check if the current user can manage the specified user
   */
  const canManageUser = useCallback((userId: string): boolean => {
    // Cannot manage yourself
    if (currentUser?.id === userId) return false;
    
    // Admins can manage all users
    if (isAdmin()) return true;
    
    // Managers can only manage members of their teams
    if (isManager() && currentUser) {
      const managedTeams = getTeamsByManager(currentUser.id);
      
      for (const team of managedTeams) {
        const teamMembers = getUsersByTeam(team.id);
        if (teamMembers.some(member => member.id === userId)) {
          return true;
        }
      }
    }
    
    return false;
  }, [currentUser, isAdmin, isManager, getTeamsByManager, getUsersByTeam]);
  
  /**
   * Check if a user can be assigned as a manager
   */
  const canBeAssignedAsManager = useCallback((userId: string): boolean => {
    // Admins can assign any user as manager
    if (isAdmin()) return true;
    
    // Managers cannot promote other users to managers
    return false;
  }, [isAdmin]);
  
  /**
   * Verify permission and conditionally show toast notification
   * Only shows toast when explicitly requested to avoid render loops
   */
  const verifyPermission = useCallback((
    permissionName: string, 
    hasPermission: boolean, 
    resourceId: string,
    showToastOnFailure: boolean = false
  ): boolean => {
    if (!hasPermission && showToastOnFailure) {
      console.log(`Permission denied: ${permissionName} on resource ${resourceId} for user ${currentUser?.id}`);
      
      toast({
        title: "Permission Denied",
        description: `You don't have permission to ${permissionName.replace('can', '').toLowerCase()} this resource.`,
        variant: "destructive",
      });
    }
    
    return hasPermission;
  }, [currentUser, toast]);
  
  return {
    // Basic permission checks without toasts for rendering
    canManageTeam,
    canManageUser,
    canBeAssignedAsManager,
    
    // Permission checks with optional toast notifications for actions
    verifyManageTeam: (teamId: string, showToast = false) => 
      verifyPermission('canManageTeam', canManageTeam(teamId), teamId, showToast),
    verifyManageUser: (userId: string, showToast = false) => 
      verifyPermission('canManageUser', canManageUser(userId), userId, showToast),
    verifyAssignManager: (userId: string, showToast = false) => 
      verifyPermission('canBeAssignedAsManager', canBeAssignedAsManager(userId), userId, showToast)
  };
}
