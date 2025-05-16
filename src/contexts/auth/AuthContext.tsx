
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from './mockData';
import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '@/utils/events/EventBus';
import { AUTH_EVENTS } from './index';
import { AuthContextType, UserMetrics } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const authContextValue = (
  currentUser: User | null,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  users: User[],
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
): AuthContextType => {
  const isAuthenticated = !!currentUser;

  const login = async (email: string, password: string) => {
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // In a real app, you would verify the password here
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));

    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const register = async (userData: Partial<User>) => {
    const newUser: User = {
      id: userData.id || `user-${Date.now()}`,
      name: userData.name || 'New User',
      email: userData.email || `user-${uuidv4().slice(0, 8)}@example.com`,
      role: userData.role || 'team-member',
      status: 'active',
      createdAt: new Date().toISOString(),
      workScheduleId: userData.workScheduleId || 'default', // Default schedule ID
      // Optional properties below - only include if they exist in userData
      ...(userData.avatar !== undefined && { avatar: userData.avatar }),
      ...(userData.department !== undefined && { department: userData.department }),
      ...(userData.position !== undefined && { position: userData.position })
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    return newUser;
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, ...updates } : user
    );

    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    // Also update current user if it's the same user
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    
    // Dispatch event that user was updated
    eventBus.publish(AUTH_EVENTS.USER_UPDATED, {
      userId,
      updates,
      timestamp: Date.now()
    });
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    await updateUser(userId, { role });
  };
  
  const updateUserWorkScheduleId = async (userId: string, scheduleId: string) => {
    await updateUser(userId, { workScheduleId: scheduleId });
    
    // Also publish a specific event for schedule ID updates
    eventBus.publish(AUTH_EVENTS.USER_SCHEDULE_UPDATED, {
      userId,
      scheduleId,
      timestamp: Date.now()
    });
  };

  const updateUserMetrics = async (userId: string, metrics: UserMetrics) => {
    // This would update user metrics in a real app
    console.log(`Updating metrics for user ${userId}:`, metrics);
    return Promise.resolve();
  };

  const getUser = (userId: string) => {
    return users.find((user) => user.id === userId) || null;
  };

  const getUserById = (userId: string) => {
    return users.find((user) => user.id === userId);
  };

  const getUsersByRole = (role: UserRole) => {
    return users.filter(user => user.role === role);
  };

  const getUsersByTeam = (teamId: string) => {
    // Mock implementation
    return users.filter(user => user.teamIds?.includes(teamId));
  };

  const getTeamsByManager = (managerId: string) => {
    // Mock implementation
    return [];
  };

  const archiveUser = async (userId: string) => {
    await updateUser(userId, { status: 'archived' });
  };

  const restoreUser = async (userId: string) => {
    await updateUser(userId, { status: 'active' });
  };

  const permanentDeleteUser = async (userId: string) => {
    const updatedUsers = users.filter((user) => user.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  // Mock implementations for team operations
  const teams = [];
  const organizations = [];
  const teamMemberships = [];
  const setTeams = () => {};
  const createTeam = async () => ({ id: '', name: '', organizationId: '', managerId: '' });
  const getTeamById = () => undefined;
  const assignManagerToTeam = async () => {};
  const addTeamMember = async () => ({ id: '', email: '', name: '', role: 'team-member' as UserRole });
  const removeUserFromTeam = async () => {};
  const deleteTeam = async () => {};
  const getOrganizationById = () => undefined;
  const addUser = async () => ({ id: '', email: '', name: '', role: 'team-member' as UserRole });
  const syncData = async () => {};
  const getAuditLogs = async () => [];

  return {
    currentUser,
    users,
    isAuthenticated,
    teams,
    organizations,
    teamMemberships,
    setTeams,
    login,
    logout,
    register,
    updateUser,
    updateUserRole,
    updateUserWorkScheduleId,
    updateUserMetrics,
    addUser,
    getUser,
    getUserById,
    getUsersByRole,
    getUsersByTeam,
    getTeamsByManager,
    archiveUser,
    restoreUser,
    permanentDeleteUser,
    createTeam,
    getTeamById,
    assignManagerToTeam,
    addTeamMember,
    removeUserFromTeam,
    deleteTeam,
    getOrganizationById,
    syncData,
    getAuditLogs
  };
};
