
import { Team, UserRole, TeamMembership } from '@/types';
import { auditService } from '@/services/auditService';
import { syncService } from '@/services/syncService';
import { AuthStateType } from '../../AuthProvider';
import { useToast } from '@/hooks/use-toast';

export const createTeamManagementOperations = (
  state: AuthStateType, 
  toast: ReturnType<typeof useToast>
) => {
  const createTeam = async (name: string, managerId: string) => {
    try {
      if (!state.currentUser || state.currentUser.role !== 'admin') {
        throw new Error("Only admins can create teams");
      }
      
      const managerUser = state.users.find(user => user.id === managerId);
      if (!managerUser) {
        throw new Error("Manager not found");
      }
      
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        name,
        organizationId: state.currentUser.organizationId,
        managerId,
        createdAt: new Date().toISOString()
      };
      
      // Update manager's role if they're not already a manager
      if (managerUser.role !== 'manager' && managerUser.role !== 'admin') {
        const updatedUser = { 
          ...managerUser, 
          role: 'manager' as UserRole,
          updatedAt: new Date().toISOString()
        };
        
        state.setUsers(prevUsers => 
          prevUsers.map(u => u.id === managerId ? updatedUser : u)
        );
        
        await auditService.logEvent(
          state.currentUser.id,
          'update_role',
          `user/${managerUser.id}`,
          `Updated ${managerUser.name}'s role from ${managerUser.role} to manager`
        );
      }
      
      state.setTeams(prevTeams => [...prevTeams, newTeam]);
      
      await auditService.logEvent(
        state.currentUser.id,
        'create_team',
        `team/${newTeam.id}`,
        `Team "${name}" created with manager ${managerUser.name}`
      );
      
      await syncService.recordSync('teams', 'success', 1);
      
      toast.toast({
        title: "Team created",
        description: `Team "${name}" has been created successfully`,
      });
      
      return newTeam;
    } catch (error) {
      toast.toast({
        title: "Failed to create team",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const assignManagerToTeam = async (managerId: string, teamId: string) => {
    try {
      if (!state.currentUser || !(state.currentUser.role === 'admin' || state.currentUser.role === 'manager')) {
        throw new Error("Only admins and managers can assign team managers");
      }
      
      const team = state.teams.find(t => t.id === teamId);
      if (!team) {
        throw new Error("Team not found");
      }
      
      const managerUser = state.users.find(user => user.id === managerId);
      if (!managerUser) {
        throw new Error("Manager not found");
      }
      
      // Check if the user is suitable to be a manager
      if (managerUser.role !== 'manager' && managerUser.role !== 'admin') {
        // Promote user to manager if they're not already a manager or admin
        const updatedUser = { 
          ...managerUser, 
          role: 'manager' as UserRole,
          updatedAt: new Date().toISOString()
        };
        
        state.setUsers(prevUsers => 
          prevUsers.map(u => u.id === managerId ? updatedUser : u)
        );
        
        await auditService.logEvent(
          state.currentUser.id,
          'update_role',
          `user/${managerUser.id}`,
          `Updated ${managerUser.name}'s role from ${managerUser.role} to manager`
        );
      }
      
      // Update the team with the new manager
      const updatedTeam = { ...team, managerId };
      state.setTeams(prevTeams => 
        prevTeams.map(t => t.id === teamId ? updatedTeam : t)
      );
      
      await auditService.logEvent(
        state.currentUser.id,
        'update_team',
        `team/${team.id}`,
        `Updated team "${team.name}" manager to ${managerUser.name}`
      );
      
      await syncService.recordSync('teams', 'success', 1);
      
      return updatedTeam;
    } catch (error) {
      toast.toast({
        title: "Failed to assign manager",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      if (!state.currentUser || state.currentUser.role !== 'admin') {
        throw new Error("Only admins can delete teams");
      }
      
      const team = state.teams.find(t => t.id === teamId);
      if (!team) {
        throw new Error("Team not found");
      }
      
      // Remove team from state
      state.setTeams(prevTeams => prevTeams.filter(t => t.id !== teamId));
      
      // Remove team memberships
      state.setTeamMemberships(prevMemberships => 
        prevMemberships.filter(m => m.teamId !== teamId)
      );
      
      await auditService.logEvent(
        state.currentUser.id,
        'delete_team',
        `team/${team.id}`,
        `Team "${team.name}" was deleted`
      );
      
      await syncService.recordSync('teams', 'success', 1);
      
      toast.toast({
        title: "Team deleted",
        description: `Team "${team.name}" has been deleted successfully`,
      });
      
      return true;
    } catch (error) {
      toast.toast({
        title: "Failed to delete team",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    createTeam,
    assignManagerToTeam,
    deleteTeam
  };
};

export type TeamManagementOperationsType = ReturnType<typeof createTeamManagementOperations>;
