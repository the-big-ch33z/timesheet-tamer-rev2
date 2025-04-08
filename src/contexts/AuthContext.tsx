import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, Organization, Team, TeamMembership, UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { auditService } from '@/services/auditService';
import { syncService } from '@/services/syncService';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  organizations: Organization[];
  teams: Team[];
  teamMemberships: TeamMembership[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, name: string, password: string, organizationName: string) => Promise<void>;
  createTeam: (name: string, managerId: string) => Promise<Team>;
  addTeamMember: (email: string, name: string, teamId: string) => Promise<User>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  assignManagerToTeam: (managerId: string, teamId: string) => Promise<void>;
  getUsersByRole: (role: UserRole) => User[];
  getUsersByTeam: (teamId: string) => User[];
  getTeamsByManager: (managerId: string) => Team[];
  getOrganizationById: (orgId: string) => Organization | undefined;
  getTeamById: (teamId: string) => Team | undefined;
  getUserById: (userId: string) => User | undefined;
  removeUserFromTeam: (userId: string, teamId: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  syncData: () => Promise<void>;
  getAuditLogs: () => Promise<any[]>;
}

const defaultAuthContext: AuthContextType = {
  currentUser: null,
  users: [],
  organizations: [],
  teams: [],
  teamMemberships: [],
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  createTeam: async () => ({ id: '', name: '', organizationId: '', managerId: '' }),
  addTeamMember: async () => ({ id: '', email: '', name: '', role: 'team-member', organizationId: '' }),
  updateUserRole: async () => {},
  assignManagerToTeam: async () => {},
  getUsersByRole: () => [],
  getUsersByTeam: () => [],
  getTeamsByManager: () => [],
  getOrganizationById: () => undefined,
  getTeamById: () => undefined,
  getUserById: () => undefined,
  removeUserFromTeam: async () => {},
  deleteTeam: async () => {},
  syncData: async () => {},
  getAuditLogs: async () => [],
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<TeamMembership[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      const storedUsers = localStorage.getItem('users');
      const storedOrgs = localStorage.getItem('organizations');
      const storedTeams = localStorage.getItem('teams');
      const storedMemberships = localStorage.getItem('teamMemberships');

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
      }
      
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedOrgs) setOrganizations(JSON.parse(storedOrgs));
      if (storedTeams) setTeams(JSON.parse(storedTeams));
      if (storedMemberships) setTeamMemberships(JSON.parse(storedMemberships));
    } catch (error) {
      console.error("Error initializing auth data:", error);
    }
  }, []);

  useEffect(() => {
    if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
    if (users.length) localStorage.setItem('users', JSON.stringify(users));
    if (organizations.length) localStorage.setItem('organizations', JSON.stringify(organizations));
    if (teams.length) localStorage.setItem('teams', JSON.stringify(teams));
    if (teamMemberships.length) localStorage.setItem('teamMemberships', JSON.stringify(teamMemberships));
  }, [currentUser, users, organizations, teams, teamMemberships]);

  const login = async (email: string, password: string) => {
    try {
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      await auditService.logEvent(
        user.id,
        'login',
        `user/${user.id}`,
        `User ${user.name} logged in`
      );
      
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${user.name}`,
      });
      
      navigate('/timesheet');
    } catch (error) {
      toast({
        title: "Login failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    if (currentUser) {
      auditService.logEvent(
        currentUser.id,
        'logout',
        `user/${currentUser.id}`,
        `User ${currentUser.name} logged out`
      );
    }
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    navigate('/login');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const register = async (email: string, name: string, password: string, organizationName: string) => {
    try {
      if (users.some(user => user.email === email)) {
        throw new Error("User with this email already exists");
      }
      
      const newOrgId = `org-${Date.now()}`;
      const newUserId = `user-${Date.now()}`;
      
      const newOrg: Organization = {
        id: newOrgId,
        name: organizationName,
        adminId: newUserId,
        createdAt: new Date().toISOString()
      };
      
      const newUser: User = {
        id: newUserId,
        email,
        name,
        role: 'admin',
        organizationId: newOrgId,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      setUsers(prevUsers => [...prevUsers, newUser]);
      setOrganizations(prevOrgs => [...prevOrgs, newOrg]);
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      
      await auditService.logEvent(
        newUser.id,
        'register',
        `user/${newUser.id}`,
        `New user registered and organization ${organizationName} created`
      );
      
      await syncService.recordSync('users', 'success', 1);
      await syncService.recordSync('organizations', 'success', 1);
      
      toast({
        title: "Registration successful",
        description: `Welcome to TimeFlow, ${name}!`,
      });
      
      navigate('/timesheet');
    } catch (error) {
      toast({
        title: "Registration failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const createTeam = async (name: string, managerId: string) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error("Only admins can create teams");
      }
      
      const managerUser = users.find(user => user.id === managerId);
      if (!managerUser) {
        throw new Error("Manager not found");
      }
      
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        name,
        organizationId: currentUser.organizationId,
        managerId,
        createdAt: new Date().toISOString()
      };
      
      if (managerUser.role !== 'manager') {
        await updateUserRole(managerId, 'manager');
      }
      
      setTeams(prevTeams => [...prevTeams, newTeam]);
      
      await auditService.logEvent(
        currentUser.id,
        'create_team',
        `team/${newTeam.id}`,
        `Team "${name}" created with manager ${managerUser.name}`
      );
      
      await syncService.recordSync('teams', 'success', 1);
      
      toast({
        title: "Team created",
        description: `Team "${name}" has been created successfully`,
      });
      
      return newTeam;
    } catch (error) {
      toast({
        title: "Failed to create team",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const addTeamMember = async (email: string, name: string, teamId: string) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        throw new Error("Team not found");
      }
      
      if (
        !currentUser || 
        (currentUser.role !== 'admin' && currentUser.id !== team.managerId)
      ) {
        throw new Error("You don't have permission to add members to this team");
      }
      
      let teamMember = users.find(user => user.email === email);
      
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
        
        setUsers(prevUsers => [...prevUsers, teamMember!]);
        
        await auditService.logEvent(
          currentUser.id,
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
        
        setUsers(prevUsers => 
          prevUsers.map(u => u.id === teamMember!.id ? teamMember! : u)
        );
        
        await auditService.logEvent(
          currentUser.id,
          'update_user',
          `user/${teamMember.id}`,
          `User ${name} added to team ${team.name}`
        );
        
        await syncService.recordSync('users', 'success', 1);
      }
      
      const newMembership: TeamMembership = {
        id: `membership-${Date.now()}`,
        teamId,
        userId: teamMember.id,
        managerId: team.managerId,
        joinedAt: new Date().toISOString()
      };
      
      setTeamMemberships(prevMemberships => [...prevMemberships, newMembership]);
      
      await syncService.recordSync('teamMemberships', 'success', 1);
      
      toast({
        title: "Team member added",
        description: `${name} has been added to the team successfully`,
      });
      
      return teamMember;
    } catch (error) {
      toast({
        title: "Failed to add team member",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error("Only admins can update user roles");
      }
      
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) {
        throw new Error("User not found");
      }
      
      const updatedUser = { 
        ...targetUser, 
        role: newRole,
        updatedAt: new Date().toISOString()
      };
      
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? updatedUser : u)
      );
      
      if (currentUser.id === userId) {
        setCurrentUser(updatedUser);
      }
      
      await auditService.logEvent(
        currentUser.id,
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

  const assignManagerToTeam = async (managerId: string, teamId: string) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error("Only admins can assign managers to teams");
      }
      
      const managerUser = users.find(user => user.id === managerId);
      const team = teams.find(t => t.id === teamId);
      
      if (!managerUser) {
        throw new Error("Manager not found");
      }
      
      if (!team) {
        throw new Error("Team not found");
      }
      
      if (managerUser.role !== 'manager') {
        await updateUserRole(managerId, 'manager');
      }
      
      const updatedTeam = { 
        ...team, 
        managerId,
        updatedAt: new Date().toISOString()
      };
      
      setTeams(prevTeams => 
        prevTeams.map(t => t.id === teamId ? updatedTeam : t)
      );
      
      setTeamMemberships(prevMemberships => 
        prevMemberships.map(membership => 
          membership.teamId === teamId 
            ? { ...membership, managerId } 
            : membership
        )
      );
      
      await auditService.logEvent(
        currentUser.id,
        'assign_manager',
        `team/${team.id}`,
        `Assigned ${managerUser.name} as manager to team ${team.name}`
      );
      
      await syncService.recordSync('teams', 'success', 1);
      await syncService.recordSync('teamMemberships', 'success', teamMemberships.filter(m => m.teamId === teamId).length);
      
      toast({
        title: "Manager assigned",
        description: `${managerUser.name} has been assigned as manager to ${team.name}`,
      });
    } catch (error) {
      toast({
        title: "Failed to assign manager",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeUserFromTeam = async (userId: string, teamId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      const team = teams.find(t => t.id === teamId);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      if (!team) {
        throw new Error("Team not found");
      }
      
      if (
        !currentUser || 
        (currentUser.role !== 'admin' && currentUser.id !== team.managerId)
      ) {
        throw new Error("You don't have permission to remove members from this team");
      }
      
      setTeamMemberships(prevMemberships => 
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
        
        setUsers(prevUsers => 
          prevUsers.map(u => u.id === userId ? updatedUser : u)
        );
      }
      
      await auditService.logEvent(
        currentUser.id,
        'remove_team_member',
        `team/${teamId}/user/${userId}`,
        `Removed ${user.name} from team ${team.name}`
      );
      
      await syncService.recordSync('teamMemberships', 'success', 1);
      await syncService.recordSync('users', 'success', 1);
      
      toast({
        title: "Team member removed",
        description: `${user.name} has been removed from ${team.name}`,
      });
    } catch (error) {
      toast({
        title: "Failed to remove team member",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error("Only admins can delete teams");
      }
      
      const team = teams.find(t => t.id === teamId);
      
      if (!team) {
        throw new Error("Team not found");
      }
      
      setTeamMemberships(prevMemberships => 
        prevMemberships.filter(membership => membership.teamId !== teamId)
      );
      
      const usersInTeam = users.filter(user => user.teamIds?.includes(teamId));
      
      usersInTeam.forEach(user => {
        const updatedUser = {
          ...user,
          teamIds: user.teamIds?.filter(id => id !== teamId),
          updatedAt: new Date().toISOString()
        };
        
        setUsers(prevUsers => 
          prevUsers.map(u => u.id === user.id ? updatedUser : u)
        );
      });
      
      setTeams(prevTeams => prevTeams.filter(t => t.id !== teamId));
      
      await auditService.logEvent(
        currentUser.id,
        'delete_team',
        `team/${teamId}`,
        `Deleted team ${team.name}`
      );
      
      await syncService.recordSync('teams', 'success', 1);
      await syncService.recordSync('teamMemberships', 'success', 1);
      await syncService.recordSync('users', 'success', usersInTeam.length);
      
      toast({
        title: "Team deleted",
        description: `Team "${team.name}" has been deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Failed to delete team",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const syncData = async () => {
    try {
      if (!currentUser) {
        throw new Error("You must be logged in to sync data");
      }
      
      toast({
        title: "Syncing data",
        description: "Starting data synchronization...",
      });
      
      await syncService.recordSync('users', 'in_progress', users.length);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await syncService.recordSync('users', 'success', users.length);
      
      await syncService.recordSync('teams', 'in_progress', teams.length);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await syncService.recordSync('teams', 'success', teams.length);
      
      await syncService.recordSync('teamMemberships', 'in_progress', teamMemberships.length);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      await syncService.recordSync('teamMemberships', 'success', teamMemberships.length);
      
      await auditService.logEvent(
        currentUser.id,
        'data_sync',
        'system/sync',
        `Synchronized ${users.length} users, ${teams.length} teams, and ${teamMemberships.length} memberships`
      );
      
      toast({
        title: "Sync complete",
        description: `Successfully synchronized all data`,
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getAuditLogs = async () => {
    try {
      if (!currentUser) {
        throw new Error("You must be logged in to view audit logs");
      }
      
      if (currentUser.role !== 'admin') {
        throw new Error("Only admins can view audit logs");
      }
      
      return await auditService.getLogs();
    } catch (error) {
      toast({
        title: "Failed to retrieve audit logs",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getUsersByRole = (role: UserRole) => {
    return users.filter(user => user.role === role);
  };

  const getUsersByTeam = (teamId: string) => {
    const membershipIds = teamMemberships
      .filter(membership => membership.teamId === teamId)
      .map(membership => membership.userId);
      
    return users.filter(user => membershipIds.includes(user.id));
  };

  const getTeamsByManager = (managerId: string) => {
    return teams.filter(team => team.managerId === managerId);
  };

  const getOrganizationById = (orgId: string) => {
    return organizations.find(org => org.id === orgId);
  };

  const getTeamById = (teamId: string) => {
    return teams.find(team => team.id === teamId);
  };

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  const value = {
    currentUser,
    users,
    organizations,
    teams,
    teamMemberships,
    isAuthenticated,
    login,
    logout,
    register,
    createTeam,
    addTeamMember,
    updateUserRole,
    assignManagerToTeam,
    getUsersByRole,
    getUsersByTeam,
    getTeamsByManager,
    getOrganizationById,
    getTeamById,
    getUserById,
    removeUserFromTeam,
    deleteTeam,
    syncData,
    getAuditLogs,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
