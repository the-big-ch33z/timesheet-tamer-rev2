
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from './useAuthState';
import { createUserOperations } from './operations';
import { createTeamOperations } from './operations/team';
import { createOrganizationOperations } from './organizationOperations';
import { createAuthOperations } from './operations/authOperations';
import { AuthContextType } from './types';
import { User, UserRole, UserMetrics } from '@/types';

// Create a default context
const defaultAuthContext: AuthContextType = {
  currentUser: null,
  users: [],
  organizations: [],
  teams: [],
  teamMemberships: [],
  isAuthenticated: false,
  setTeams: () => {},
  login: async () => { throw new Error('Not implemented'); },
  logout: () => {},
  register: async () => { throw new Error('Not implemented'); },
  updateUser: async () => {},
  updateUserRole: async () => {},
  updateUserWorkScheduleId: async () => {},
  updateUserMetrics: async () => {},
  createTeam: async () => ({ id: '', name: '', organizationId: '', managerId: '' }),
  addUser: async () => ({ id: '', email: '', name: '', role: 'team-member' }),
  addTeamMember: async () => ({ id: '', email: '', name: '', role: 'team-member' }),
  getUser: () => null,
  getUserById: () => undefined,
  getUsersByRole: () => [],
  getUsersByTeam: () => [],
  getTeamsByManager: () => [],
  getOrganizationById: () => undefined,
  getTeamById: () => undefined,
  assignManagerToTeam: async () => {},
  removeUserFromTeam: async () => {},
  deleteTeam: async () => {},
  archiveUser: async () => {},
  restoreUser: async () => {},
  permanentDeleteUser: async () => {},
  syncData: async () => {},
  getAuditLogs: async () => [],
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

export type AuthStateType = ReturnType<typeof useAuthState>;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state
  const state = useAuthState();
  const navigate = useNavigate();
  const toast = useToast();

  // Create operations
  const userOperations = createUserOperations(state, toast);
  const teamOperations = createTeamOperations(state, toast);
  const orgOperations = createOrganizationOperations(state);
  const authOperations = createAuthOperations(state, toast, navigate);

  // Default implementation for missing methods
  const defaultUpdateUser = async (userId: string, updates: Partial<User>) => {
    console.log(`Default implementation of updateUser: ${userId}`, updates);
  };

  const defaultWorkScheduleId = async (userId: string, scheduleId: string) => {
    console.log(`Default implementation of updateUserWorkScheduleId: ${userId}, ${scheduleId}`);
  };

  const defaultGetUser = (userId: string) => {
    return state.users.find(user => user.id === userId) || null;
  };

  // Combine all operations into context value
  const value: AuthContextType = {
    currentUser: state.currentUser,
    users: state.users,
    organizations: state.organizations,
    teams: state.teams,
    teamMemberships: state.teamMemberships,
    setTeams: state.setTeams,
    isAuthenticated: state.isAuthenticated,
    login: authOperations.login || defaultAuthContext.login,
    logout: authOperations.logout || defaultAuthContext.logout,
    register: authOperations.register || defaultAuthContext.register,
    ...userOperations,
    ...teamOperations,
    ...orgOperations,
    // Ensure all required properties are included with fallbacks
    updateUser: userOperations.updateUser || defaultUpdateUser,
    updateUserWorkScheduleId: userOperations.updateUserWorkScheduleId || defaultWorkScheduleId,
    updateUserMetrics: userOperations.updateUserMetrics || defaultAuthContext.updateUserMetrics,
    getUser: userOperations.getUser || defaultGetUser,
    getUserById: userOperations.getUserById || defaultAuthContext.getUserById,
    getUsersByRole: userOperations.getUsersByRole || defaultAuthContext.getUsersByRole,
    getUsersByTeam: userOperations.getUsersByTeam || defaultAuthContext.getUsersByTeam,
    getTeamsByManager: teamOperations.getTeamsByManager || defaultAuthContext.getTeamsByManager,
    addUser: userOperations.addUser || defaultAuthContext.addUser,
    syncData: authOperations.syncData || defaultAuthContext.syncData,
    getAuditLogs: authOperations.getAuditLogs || defaultAuthContext.getAuditLogs,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
