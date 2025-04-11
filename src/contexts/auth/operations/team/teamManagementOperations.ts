
import { Team, UserRole } from '@/types';
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
      if (!state.currentUser || state.currentUser.role !== 'admin') {
        throw new Error("Only admins can assign managers to teams");
      }
      
      const managerUser = state.users.find(user => user.id === managerId);
      const team = state.teams.find(t => t.id === teamId);
      
      if (!managerUser) {
        throw new Error("Manager not found");
      }
      
      if (!team) {
        throw new Error("Team not found");
      }
      
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
      
      const updatedTeam = { 
        ...team, 
        managerId,
        updatedAt: new Date().toISOString()
      };
      
      state.setTeams(prevTeams => 
        prevTeams.map(t => t.id === teamId ? updatedTeam : t)
      );
      
      state.setTeamMemberships(prevMemberships => 
        prevMemberships.map(membership => 
          membership.teamId === teamId 
            ? { ...membership, managerId } 
            : membership
        )
      );
      
      await auditService.logEvent(
        state.currentUser.id,
        'assign_manager',
        `team/${team.id}`,
        `Assigned ${managerUser.name} as manager to team ${team.name}`
      );
      
      await syncService.recordSync('teams', 'success', 1);
      await syncService.recordSync('teamMemberships', 'success', state.teamMemberships.filter(m => m.teamId === teamId).length);
      
      toast.toast({
        title: "Manager assigned",
        description: `${managerUser.name} has been assigned as manager to ${team.name}`,
      });
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
      
      state.setTeamMemberships(prevMemberships => 
        prevMemberships.filter(membership => membership.teamId !== teamId)
      );
      
      const usersInTeam = state.users.filter(user => user.teamIds?.includes(teamId));
      
      usersInTeam.forEach(user => {
        const updatedUser = {
          ...user,
          teamIds: user.teamIds?.filter(id => id !== teamId),
          updatedAt: new Date().toISOString()
        };
        
        state.setUsers(prevUsers => 
          prevUsers.map(u => u.id === user.id ? updatedUser : u)
        );
      });
      
      state.setTeams(prevTeams => prevTeams.filter(t => t.id !== teamId));
      
      await auditService.logEvent(
        state.currentUser.id,
        'delete_team',
        `team/${teamId}`,
        `Deleted team ${team.name}`
      );
      
      await syncService.recordSync('teams', 'success', 1);
      await syncService.recordSync('teamMemberships', 'success', 1);
      await syncService.recordSync('users', 'success', usersInTeam.length);
      
      toast.toast({
        title: "Team deleted",
        description: `Team "${team.name}" has been deleted successfully`,
      });
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
