
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, Organization, Team, TeamMembership, UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

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
}

// Initial empty state
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

  // Initialize data from localStorage
  useEffect(() => {
    try {
      // Try to load existing data from localStorage
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

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
    if (users.length) localStorage.setItem('users', JSON.stringify(users));
    if (organizations.length) localStorage.setItem('organizations', JSON.stringify(organizations));
    if (teams.length) localStorage.setItem('teams', JSON.stringify(teams));
    if (teamMemberships.length) localStorage.setItem('teamMemberships', JSON.stringify(teamMemberships));
  }, [currentUser, users, organizations, teams, teamMemberships]);

  const login = async (email: string, password: string) => {
    try {
      // In a real app, this would be an API call
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Simulate password check (in a real app, this would be done securely on the server)
      // For demo purposes we're not checking passwords
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
      
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
      // Check if user with this email already exists
      if (users.some(user => user.email === email)) {
        throw new Error("User with this email already exists");
      }
      
      // Create a new organization
      const newOrgId = `org-${Date.now()}`;
      const newUserId = `user-${Date.now()}`;
      
      const newOrg: Organization = {
        id: newOrgId,
        name: organizationName,
        adminId: newUserId,
      };
      
      // Create a new user with admin role
      const newUser: User = {
        id: newUserId,
        email,
        name,
        role: 'admin', // First user is always an admin
        organizationId: newOrgId,
      };
      
      setUsers(prevUsers => [...prevUsers, newUser]);
      setOrganizations(prevOrgs => [...prevOrgs, newOrg]);
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      
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
      // Verify the current user is an admin
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error("Only admins can create teams");
      }
      
      // Get the manager user
      const managerUser = users.find(user => user.id === managerId);
      if (!managerUser) {
        throw new Error("Manager not found");
      }
      
      // Create a new team
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        name,
        organizationId: currentUser.organizationId,
        managerId,
      };
      
      // Update manager's role if they're not already a manager
      if (managerUser.role !== 'manager') {
        await updateUserRole(managerId, 'manager');
      }
      
      setTeams(prevTeams => [...prevTeams, newTeam]);
      
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
      // Check if user with this email already exists
      let teamMember = users.find(user => user.email === email);
      const team = teams.find(t => t.id === teamId);
      
      if (!team) {
        throw new Error("Team not found");
      }
      
      if (!teamMember) {
        // Create a new user with team-member role
        teamMember = {
          id: `user-${Date.now()}`,
          email,
          name,
          role: 'team-member',
          organizationId: team.organizationId,
          teamIds: [teamId]
        };
        
        setUsers(prevUsers => [...prevUsers, teamMember!]);
      } else {
        // Update existing user's teams
        teamMember = {
          ...teamMember,
          teamIds: [...(teamMember.teamIds || []), teamId]
        };
        
        setUsers(prevUsers => 
          prevUsers.map(u => u.id === teamMember!.id ? teamMember! : u)
        );
      }
      
      // Create a team membership
      const newMembership: TeamMembership = {
        id: `membership-${Date.now()}`,
        teamId,
        userId: teamMember.id,
        managerId: team.managerId
      };
      
      setTeamMemberships(prevMemberships => [...prevMemberships, newMembership]);
      
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
      // Verify the current user is an admin
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error("Only admins can update user roles");
      }
      
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) {
        throw new Error("User not found");
      }
      
      // Update the user's role
      const updatedUser = { ...targetUser, role: newRole };
      
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? updatedUser : u)
      );
      
      // If this is the current user, update currentUser state too
      if (currentUser.id === userId) {
        setCurrentUser(updatedUser);
      }
      
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
      // Verify the current user is an admin
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
      
      // Update manager's role if they're not already a manager
      if (managerUser.role !== 'manager') {
        await updateUserRole(managerId, 'manager');
      }
      
      // Update the team with the new manager
      const updatedTeam = { ...team, managerId };
      
      setTeams(prevTeams => 
        prevTeams.map(t => t.id === teamId ? updatedTeam : t)
      );
      
      // Update all team memberships for this team
      setTeamMemberships(prevMemberships => 
        prevMemberships.map(membership => 
          membership.teamId === teamId 
            ? { ...membership, managerId } 
            : membership
        )
      );
      
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

  // Helper functions for querying the data
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
