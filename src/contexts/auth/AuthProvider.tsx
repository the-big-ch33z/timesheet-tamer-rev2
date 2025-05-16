
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

  // Ensure login function returns a User
  const safeLogin = async (email: string, password: string): Promise<User> => {
    if (authOperations.login) {
      return await authOperations.login(email, password);
    }
    throw new Error('Login not implemented');
  };

  // Ensure register function returns a User
  const safeRegister = async (userData: Partial<User>): Promise<User> => {
    if (authOperations.register) {
      const user = await authOperations.register(userData as any);
      return user as User;
    }
    throw new Error('Register not implemented');
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
    login: safeLogin,
    logout: authOperations.logout || defaultAuthContext.logout,
    register: safeRegister,
    updateUser: userOperations.updateUser || defaultUpdateUser,
    updateUserRole: userOperations.updateUserRole || defaultAuthContext.updateUserRole,
    updateUserWorkScheduleId: userOperations.updateUserWorkScheduleId || defaultWorkScheduleId,
    updateUserMetrics: userOperations.updateUserMetrics || defaultAuthContext.updateUserMetrics,
    getUser: userOperations.getUser || defaultGetUser,
    getUserById: userOperations.getUserById || defaultAuthContext.getUserById,
    getUsersByRole: userOperations.getUsersByRole || defaultAuthContext.getUsersByRole,
    getUsersByTeam: userOperations.getUsersByTeam || defaultAuthContext.getUsersByTeam,
    getTeamsByManager: teamOperations.getTeamsByManager || defaultAuthContext.getTeamsByManager,
    addUser: userOperations.addUser || defaultAuthContext.addUser,
    addTeamMember: teamOperations.addTeamMember || defaultAuthContext.addTeamMember,
    createTeam: teamOperations.createTeam || defaultAuthContext.createTeam,
    getTeamById: teamOperations.getTeamById || defaultAuthContext.getTeamById,
    assignManagerToTeam: teamOperations.assignManagerToTeam || defaultAuthContext.assignManagerToTeam,
    removeUserFromTeam: teamOperations.removeUserFromTeam || defaultAuthContext.removeUserFromTeam,
    deleteTeam: teamOperations.deleteTeam || defaultAuthContext.deleteTeam,
    getOrganizationById: orgOperations.getOrganizationById || defaultAuthContext.getOrganizationById,
    archiveUser: userOperations.archiveUser || defaultAuthContext.archiveUser,
    restoreUser: userOperations.restoreUser || defaultAuthContext.restoreUser,
    permanentDeleteUser: userOperations.permanentDeleteUser || defaultAuthContext.permanentDeleteUser,
    syncData: authOperations.syncData || defaultAuthContext.syncData,
    getAuditLogs: authOperations.getAuditLogs || defaultAuthContext.getAuditLogs
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
