
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from './mockData';
import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '@/utils/events/EventBus';
import { AUTH_EVENTS } from './index';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  register: (user: Partial<User>) => Promise<User>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserWorkScheduleId: (userId: string, scheduleId: string) => Promise<void>;
  getUser: (userId: string) => User | null;
  archiveUser: (userId: string) => Promise<void>;
  restoreUser: (userId: string) => Promise<void>;
  permanentDeleteUser: (userId: string) => Promise<void>;
}

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
      role: userData.role || 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      avatar: userData.avatar || null,
      department: userData.department || null,
      position: userData.position || null,
      workScheduleId: userData.workScheduleId || 'default' // Default schedule ID
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

  const getUser = (userId: string) => {
    return users.find((user) => user.id === userId) || null;
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

  return {
    currentUser,
    users,
    isAuthenticated,
    login,
    logout,
    register,
    updateUser,
    updateUserRole,
    updateUserWorkScheduleId,
    getUser,
    archiveUser,
    restoreUser,
    permanentDeleteUser
  };
};
