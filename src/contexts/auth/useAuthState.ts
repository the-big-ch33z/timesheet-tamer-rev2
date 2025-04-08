
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
