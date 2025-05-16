
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { User } from '@/types';

export interface UserMetrics {
  fte: number;
  fortnightHours: number;
}

interface UserMetricsContextType {
  setUserMetrics: (userId: string, metrics: UserMetrics) => Promise<void>;
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

  const value = {
    setUserMetrics
  };

  return (
    <UserMetricsContext.Provider value={value}>
      {children}
    </UserMetricsContext.Provider>
  );
};
