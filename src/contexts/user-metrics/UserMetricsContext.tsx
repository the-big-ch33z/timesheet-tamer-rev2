
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useErrorContext } from '../error/ErrorContext';
import { BaseContextProvider } from '../base/BaseContext';
import { useLogger } from '@/hooks/useLogger';
import { UserMetrics, UserMetricsContextType, DEFAULT_USER_METRICS } from './types';

// Create context
const UserMetricsContext = createContext<UserMetricsContextType | undefined>(undefined);

export interface UserMetricsProviderProps {
  children: ReactNode;
}

/**
 * Provider component for user metrics
 */
export const UserMetricsProvider: React.FC<UserMetricsProviderProps> = ({ children }) => {
  const logger = useLogger('UserMetricsContext');
  const [metricsStore, setMetricsStore] = useState<Record<string, UserMetrics>>({});
  
  // Use try/catch for error context in case it's not available
  let errorHandler = { handleError: (error: any) => console.error(error) };
  try {
    errorHandler = useErrorContext();
  } catch (error) {
    logger.warn('ErrorContext not available in UserMetricsContext, using fallback');
  }

  // Get metrics for a specific user
  const getUserMetrics = useCallback((userId: string): UserMetrics => {
    logger.debug(`Getting metrics for user ${userId}`);
    return metricsStore[userId] || DEFAULT_USER_METRICS;
  }, [metricsStore, logger]);

  // Update metrics for a specific user
  const updateUserMetrics = useCallback(async (userId: string, metrics: Partial<UserMetrics>): Promise<void> => {
    logger.debug(`Updating metrics for user ${userId}:`, metrics);
    try {
      setMetricsStore(prev => ({
        ...prev,
        [userId]: {
          ...getUserMetrics(userId),
          ...metrics
        }
      }));
      return Promise.resolve();
    } catch (error) {
      logger.error(`Failed to update metrics for user ${userId}:`, error);
      errorHandler.handleError(error);
      return Promise.reject(error);
    }
  }, [metricsStore, getUserMetrics, logger, errorHandler]);

  // Reset metrics for a specific user
  const resetUserMetrics = useCallback(async (userId: string): Promise<void> => {
    logger.debug(`Resetting metrics for user ${userId}`);
    try {
      setMetricsStore(prev => {
        const newStore = { ...prev };
        delete newStore[userId];
        return newStore;
      });
      return Promise.resolve();
    } catch (error) {
      logger.error(`Failed to reset metrics for user ${userId}:`, error);
      errorHandler.handleError(error);
      return Promise.reject(error);
    }
  }, [logger, errorHandler]);

  // Initialize metrics from storage or API
  const initializeMetrics = async () => {
    try {
      logger.debug('Initializing user metrics');
      
      // This could be extended to load from localStorage or an API
      return {};
    } catch (error) {
      logger.error('Failed to initialize metrics:', error);
      errorHandler.handleError(error);
      throw error;
    }
  };

  const contextValue: UserMetricsContextType = {
    getUserMetrics,
    updateUserMetrics,
    resetUserMetrics
  };

  return (
    <BaseContextProvider
      contextName="UserMetrics"
      initializer={initializeMetrics}
      autoInitialize={true}
    >
      <UserMetricsContext.Provider value={contextValue}>
        {children}
      </UserMetricsContext.Provider>
    </BaseContextProvider>
  );
};

/**
 * Hook for accessing user metrics context
 */
export const useUserMetrics = (): UserMetricsContextType => {
  const context = useContext(UserMetricsContext);
  
  if (!context) {
    throw new Error('useUserMetrics must be used within a UserMetricsProvider');
  }
  
  return context;
};
