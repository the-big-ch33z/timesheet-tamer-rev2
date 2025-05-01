
import { useState, useEffect } from 'react';
import { User, Organization, Team, TeamMembership } from '@/types';
import { useLogger } from '@/hooks/useLogger';

export function useAuthState() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<TeamMembership[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const logger = useLogger('AuthState');

  // Helper function to safely parse JSON from localStorage
  const safelyParseJSON = <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      
      const parsed = JSON.parse(item);
      return parsed || fallback;
    } catch (error) {
      logger.error(`Error parsing ${key} from localStorage:`, error);
      // Remove the corrupted data
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore secondary errors during cleanup
      }
      return fallback;
    }
  };

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      logger.info("Initializing auth state from localStorage");
      setIsLoading(true);
      
      // Safely load each piece of state with appropriate fallbacks
      const parsedUser = safelyParseJSON<User | null>('currentUser', null);
      const parsedUsers = safelyParseJSON<User[]>('users', []);
      const parsedOrgs = safelyParseJSON<Organization[]>('organizations', []);
      const parsedTeams = safelyParseJSON<Team[]>('teams', []);
      const parsedMemberships = safelyParseJSON<TeamMembership[]>('teamMemberships', []);
      
      if (parsedUser) {
        logger.debug("Found current user in localStorage");
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
      }
      
      setUsers(parsedUsers);
      setOrganizations(parsedOrgs);
      setTeams(parsedTeams);
      setTeamMemberships(parsedMemberships);
      
      logger.info("Auth state initialized", {
        hasUser: !!parsedUser,
        userCount: parsedUsers.length,
        teamCount: parsedTeams.length
      });
    } catch (error) {
      logger.error("Error initializing auth data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial loading
    
    try {
      // Save current user
      if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('currentUser');
      }
      
      // Save other state
      if (users.length) localStorage.setItem('users', JSON.stringify(users));
      if (organizations.length) localStorage.setItem('organizations', JSON.stringify(organizations));
      if (teams.length) localStorage.setItem('teams', JSON.stringify(teams));
      if (teamMemberships.length) localStorage.setItem('teamMemberships', JSON.stringify(teamMemberships));
      
      logger.debug("Auth state persisted to localStorage");
    } catch (error) {
      logger.error("Error persisting auth state to localStorage:", error);
    }
  }, [currentUser, users, organizations, teams, teamMemberships, isLoading]);

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
    isLoading
  };
}
