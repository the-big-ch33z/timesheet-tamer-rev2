import { User, UserRole } from '@/types';
import { auditService } from '@/services/auditService';
import { syncService } from '@/services/syncService';
import { AuthStateType } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';

export const createUserOperations = (state: AuthStateType, toast: ReturnType<typeof useToast>) => {
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

  const updateUserRole = async (userId: string, newRole: UserRole) => {
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

  const addUser = async (email: string, name: string, role: UserRole = 'team-member') => {
    try {
      if (!state.currentUser) {
        throw new Error("You must be logged in to add a user");
      }

      if (state.currentUser.role !== 'admin') {
        throw new Error("Only admins can add users");
      }

      if (state.users.some(u => u.email === email)) {
        throw new Error("A user with this email already exists");
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        name,
        role,
        organizationId: state.currentUser.organizationId,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      state.setUsers(prevUsers => [...prevUsers, newUser]);

      await auditService.logEvent(
        state.currentUser.id,
        'create_user',
        `user/${newUser.id}`,
        `Created new user ${name} with role ${role}`
      );

      await syncService.recordSync('users', 'success', 1);

      toast.toast({
        title: "User created",
        description: `${name} has been added as a ${role}`,
      });

      return newUser;
    } catch (error) {
      toast.toast({
        title: "Failed to add user",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const addTeamMember = async (email: string, name: string, teamId: string) => {
    try {
      if (!teamId) {
        return await addUser(email, name, 'team-member');
      }

      const team = state.teams.find(t => t.id === teamId);
      if (!team) {
        throw new Error("Team not found");
      }
      
      if (
        !state.currentUser || 
        (state.currentUser.role !== 'admin' && state.currentUser.id !== team.managerId)
      ) {
        throw new Error("You don't have permission to add members to this team");
      }
      
      let teamMember = state.users.find(user => user.email === email);
      
      if (!teamMember) {
        teamMember = {
          id: `user-${Date.now()}`,
          email,
          name,
          role: 'team-member',
          organizationId: team.organizationId,
          teamIds: [teamId],
          createdAt: new Date().toISOString(),
          status: 'active'
        };
        
        state.setUsers(prevUsers => [...prevUsers, teamMember!]);
        
        await auditService.logEvent(
          state.currentUser.id,
          'create_user',
          `user/${teamMember.id}`,
          `New user ${name} created and added to team ${team.name}`
        );
        
        await syncService.recordSync('users', 'success', 1);
      } else {
        teamMember = {
          ...teamMember,
          teamIds: [...(teamMember.teamIds || []), teamId]
        };
        
        state.setUsers(prevUsers => 
          prevUsers.map(u => u.id === teamMember!.id ? teamMember! : u)
        );
        
        await auditService.logEvent(
          state.currentUser.id,
          'update_user',
          `user/${teamMember.id}`,
          `User ${name} added to team ${team.name}`
        );
        
        await syncService.recordSync('users', 'success', 1);
      }
      
      const newMembership = {
        id: `membership-${Date.now()}`,
        teamId,
        userId: teamMember.id,
        managerId: team.managerId,
        joinedAt: new Date().toISOString()
      };
      
      state.setTeamMemberships(prevMemberships => [...prevMemberships, newMembership]);
      
      await syncService.recordSync('teamMemberships', 'success', 1);
      
      toast.toast({
        title: "Team member added",
        description: `${name} has been added to the team successfully`,
      });
      
      return teamMember;
    } catch (error) {
      toast.toast({
        title: "Failed to add team member",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeUserFromTeam = async (userId: string, teamId: string) => {
    try {
      const user = state.users.find(u => u.id === userId);
      const team = state.teams.find(t => t.id === teamId);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      if (!team) {
        throw new Error("Team not found");
      }
      
      if (
        !state.currentUser || 
        (state.currentUser.role !== 'admin' && state.currentUser.id !== team.managerId)
      ) {
        throw new Error("You don't have permission to remove members from this team");
      }
      
      state.setTeamMemberships(prevMemberships => 
        prevMemberships.filter(
          membership => !(membership.teamId === teamId && membership.userId === userId)
        )
      );
      
      if (user.teamIds?.includes(teamId)) {
        const updatedUser = {
          ...user,
          teamIds: user.teamIds.filter(id => id !== teamId),
          updatedAt: new Date().toISOString()
        };
        
        state.setUsers(prevUsers => 
          prevUsers.map(u => u.id === userId ? updatedUser : u)
        );
      }
      
      await auditService.logEvent(
        state.currentUser.id,
        'remove_team_member',
        `team/${teamId}/user/${userId}`,
        `Removed ${user.name} from team ${team.name}`
      );
      
      await syncService.recordSync('teamMemberships', 'success', 1);
      await syncService.recordSync('users', 'success', 1);
      
      toast.toast({
        title: "Team member removed",
        description: `${user.name} has been removed from ${team.name}`,
      });
    } catch (error) {
      toast.toast({
        title: "Failed to remove team member",
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
    addUser,
    addTeamMember,
    removeUserFromTeam
  };
};

export type UserOperationsType = ReturnType<typeof createUserOperations>;
