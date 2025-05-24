
import { User, UserRole } from '@/types';
import { auditService } from '@/services/auditService';
import { syncService } from '@/services/syncService';
import { AuthStateType } from '../AuthProvider';
import { useToast } from '@/components/ui/use-toast';

export const createUserCreationOperations = (state: AuthStateType, toast: ReturnType<typeof useToast>) => {
  const addUser = async (email: string, name: string, role: UserRole = 'team-member'): Promise<User> => {
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
        workScheduleId: 'default', // FIX: Always assign default work schedule
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

  const addTeamMember = async (email: string, name: string, teamId: string): Promise<User> => {
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
          workScheduleId: 'default', // FIX: Always assign default work schedule
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
        // FIX: Ensure existing user has work schedule when added to team
        teamMember = {
          ...teamMember,
          teamIds: [...(teamMember.teamIds || []), teamId],
          workScheduleId: teamMember.workScheduleId || 'default'
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

  const removeUserFromTeam = async (userId: string, teamId: string): Promise<void> => {
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
    addUser,
    addTeamMember,
    removeUserFromTeam
  };
};
