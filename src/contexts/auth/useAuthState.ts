
import { useState, useEffect } from 'react';
import { User, Organization, Team, TeamMembership } from '@/types';

export function useAuthState() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<TeamMembership[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      // Add demo data initialization if storage is empty
      const initializeDefaultData = () => {
        console.log("Initializing default data...");
        
        // Create default organization
        const defaultOrg = {
          id: 'org-default',
          name: 'Default Organization',
          adminId: 'user-admin',
          createdAt: new Date().toISOString()
        };
        
        // Create default users
        const defaultUsers = [
          {
            id: 'user-admin',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin' as const,
            organizationId: 'org-default',
            createdAt: new Date().toISOString(),
            status: 'active' as const
          },
          {
            id: 'user-manager',
            email: 'manager@example.com',
            name: 'Manager User',
            role: 'manager' as const,
            organizationId: 'org-default',
            createdAt: new Date().toISOString(),
            status: 'active' as const
          },
          {
            id: 'user-member',
            email: 'member@example.com',
            name: 'Team Member',
            role: 'team-member' as const,
            organizationId: 'org-default',
            createdAt: new Date().toISOString(),
            status: 'active' as const
          }
        ];
        
        // Create default team
        const defaultTeam = {
          id: 'team-default',
          name: 'Default Team',
          organizationId: 'org-default',
          managerId: 'user-manager',
          createdAt: new Date().toISOString()
        };
        
        // Create default team memberships
        const defaultMemberships = [
          {
            id: 'membership-1',
            userId: 'user-manager',
            teamId: 'team-default',
            addedAt: new Date().toISOString()
          },
          {
            id: 'membership-2',
            userId: 'user-member',
            teamId: 'team-default',
            addedAt: new Date().toISOString()
          }
        ];
        
        // Set the state and save to localStorage
        setOrganizations([defaultOrg]);
        setUsers(defaultUsers);
        setTeams([defaultTeam]);
        setTeamMemberships(defaultMemberships);
        
        localStorage.setItem('organizations', JSON.stringify([defaultOrg]));
        localStorage.setItem('users', JSON.stringify(defaultUsers));
        localStorage.setItem('teams', JSON.stringify([defaultTeam]));
        localStorage.setItem('teamMemberships', JSON.stringify(defaultMemberships));
        
        // Set current user to admin for demonstration
        setCurrentUser(defaultUsers[0]);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(defaultUsers[0]));
      };
      
      const storedUser = localStorage.getItem('currentUser');
      const storedUsers = localStorage.getItem('users');
      const storedOrgs = localStorage.getItem('organizations');
      const storedTeams = localStorage.getItem('teams');
      const storedMemberships = localStorage.getItem('teamMemberships');

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
        console.log("Current user loaded from storage:", parsedUser.id);
      }
      
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
      
      if (storedOrgs) {
        setOrganizations(JSON.parse(storedOrgs));
      }
      
      if (storedTeams) {
        setTeams(JSON.parse(storedTeams));
      }
      
      if (storedMemberships) {
        setTeamMemberships(JSON.parse(storedMemberships));
      }
      
      // If no data is found, initialize with demo data
      if (!storedUser && !storedUsers && !storedOrgs) {
        initializeDefaultData();
      }
    } catch (error) {
      console.error("Error initializing auth data:", error);
      // Recover from error by initializing with empty arrays
      setUsers([]);
      setOrganizations([]);
      setTeams([]);
      setTeamMemberships([]);
    }
  }, []);

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
    if (users.length) localStorage.setItem('users', JSON.stringify(users));
    if (organizations.length) localStorage.setItem('organizations', JSON.stringify(organizations));
    if (teams.length) localStorage.setItem('teams', JSON.stringify(teams));
    if (teamMemberships.length) localStorage.setItem('teamMemberships', JSON.stringify(teamMemberships));
  }, [currentUser, users, organizations, teams, teamMemberships]);

  return {
    currentUser,
    setCurrentUser,
    users,
    setUsers,
    organizations,
    setOrganizations,
    teams,
    setTeams,
    teamMemberships,
    setTeamMemberships,
    isAuthenticated,
    setIsAuthenticated,
  };
}
