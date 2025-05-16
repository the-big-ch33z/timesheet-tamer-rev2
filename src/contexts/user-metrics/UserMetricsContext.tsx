
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { User, UserMetrics } from '@/types';

interface UserMetricsContextType {
  getUserMetrics: (userId: string) => UserMetrics;
  setUserMetrics: (userId: string, metrics: UserMetrics) => Promise<void>;
  updateUserMetrics: (userId: string, metrics: Partial<UserMetrics>) => Promise<void>;
}

const UserMetricsContext = createContext<UserMetricsContextType | undefined>(undefined);

export const useUserMetrics = () => {
  const context = useContext(UserMetricsContext);
  if (!context) {
    throw new Error('useUserMetrics must be used within a UserMetricsProvider');
  }
  return context;
};

export const UserMetricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [metricsState, setMetricsState] = useState<Record<string, UserMetrics>>({});

  // Get metrics for a user
  const getUserMetrics = (userId: string): UserMetrics => {
    return metricsState[userId] || {
      fte: 1.0,
      fortnightHours: 76
    };
  };

  // Function to update a user's metrics
  const setUserMetrics = async (userId: string, metrics: UserMetrics) => {
    // Update local state
    setMetricsState(prev => ({
      ...prev,
      [userId]: metrics
    }));

    // Also update in the auth context if available
    if (auth.updateUserMetrics) {
      // Pass complete metrics with required properties
      await auth.updateUserMetrics(userId, {
        fte: metrics.fte,
        fortnightHours: metrics.fortnightHours
      });
    }
  };

  // Function to update partial metrics
  const updateUserMetrics = async (userId: string, metrics: Partial<UserMetrics>) => {
    const currentMetrics = getUserMetrics(userId);
    const updatedMetrics = {
      ...currentMetrics,
      ...metrics
    };

    return setUserMetrics(userId, updatedMetrics);
  };

  const value = {
    getUserMetrics,
    setUserMetrics,
    updateUserMetrics
  };

  return (
    <UserMetricsContext.Provider value={value}>
      {children}
    </UserMetricsContext.Provider>
  );
};
