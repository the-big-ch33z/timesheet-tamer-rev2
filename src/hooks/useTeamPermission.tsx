
import { useAuth } from '@/contexts/auth';
import { useRolePermission } from '@/hooks/useRolePermission';
import { User, Team } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useTeamPermission() {
  const { currentUser, teams, getUsersByTeam, getTeamsByManager } = useAuth();
  const { isAdmin, isManager } = useRolePermission();
  const { toast } = useToast();
  
  /**
   * Check if the current user can manage the specified team
   */
  const canManageTeam = (teamId: string): boolean => {
    // Admins can manage all teams
    if (isAdmin()) return true;
    
    // Managers can only manage their own teams
    if (isManager() && currentUser) {
      const managedTeams = getTeamsByManager(currentUser.id);
      return managedTeams.some(team => team.id === teamId);
    }
    
    return false;
  };
  
  /**
   * Check if the current user can manage the specified user
   */
  const canManageUser = (userId: string): boolean => {
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
  };
  
  /**
   * Check if a user can be assigned as a manager
   */
  const canBeAssignedAsManager = (userId: string): boolean => {
    // Admins can assign any user as manager
    if (isAdmin()) return true;
    
    // Managers cannot promote other users to managers
    return false;
  };
  
  /**
   * Verify and log permission check
   */
  const verifyPermission = (
    permissionName: string, 
    hasPermission: boolean, 
    resourceId: string
  ): boolean => {
    if (!hasPermission) {
      console.log(`Permission denied: ${permissionName} on resource ${resourceId} for user ${currentUser?.id}`);
      
      toast({
        title: "Permission Denied",
        description: `You don't have permission to ${permissionName.replace('can', '').toLowerCase()} this resource.`,
        variant: "destructive",
      });
    }
    
    return hasPermission;
  };
  
  return {
    canManageTeam: (teamId: string) => verifyPermission('canManageTeam', canManageTeam(teamId), teamId),
    canManageUser: (userId: string) => verifyPermission('canManageUser', canManageUser(userId), userId),
    canBeAssignedAsManager: (userId: string) => verifyPermission('canBeAssignedAsManager', canBeAssignedAsManager(userId), userId)
  };
}
