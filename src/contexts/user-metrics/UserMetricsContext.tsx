
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useErrorContext } from '../error/ErrorContext';
import { BaseContextProvider, BaseContextState } from '../base/BaseContext';
import { useLogger } from '@/hooks/useLogger';

// Define types for user metrics
export interface UserMetrics {
  totalHoursWorked: number;
  averageHoursPerWeek: number;
  totalDaysWorked: number;
  completionRate: number;
}

// Define the context type
export interface UserMetricsContextType extends BaseContextState {
  metrics: UserMetrics | null;
  isLoading: boolean;
  updateMetrics: (metrics: Partial<UserMetrics>) => void;
  resetMetrics: () => void;
}

// Create context
const UserMetricsContext = createContext<UserMetricsContextType | undefined>(undefined);

// Initial state for metrics
const initialMetrics: UserMetrics = {
  totalHoursWorked: 0,
  averageHoursPerWeek: 0,
  totalDaysWorked: 0,
  completionRate: 0
};

export interface UserMetricsProviderProps {
  children: ReactNode;
}

/**
 * Provider component for user metrics
 */
export const UserMetricsProvider: React.FC<UserMetricsProviderProps> = ({ children }) => {
  const logger = useLogger('UserMetricsContext');
  const [metrics, setMetrics] = useState<UserMetrics | null>(initialMetrics);
  
  // Use try/catch for error context in case it's not available
  let errorHandler = { handleError: (error: any) => console.error(error) };
  try {
    errorHandler = useErrorContext();
  } catch (error) {
    logger.warn('ErrorContext not available in UserMetricsContext, using fallback');
  }

  // Initialize metrics from storage or API
  const initializeMetrics = async () => {
    try {
      logger.debug('Initializing user metrics');
      
      // For now just return the initial metrics
      // This could be extended to load from localStorage or an API
      return initialMetrics;
    } catch (error) {
      logger.error('Failed to initialize metrics:', error);
      errorHandler.handleError(error, 'UserMetricsContext initialization');
      throw error;
    }
  };

  // Update metrics
  const updateMetrics = (newMetrics: Partial<UserMetrics>) => {
    setMetrics(current => {
      if (!current) return { ...initialMetrics, ...newMetrics };
      return { ...current, ...newMetrics };
    });
  };

  // Reset metrics to initial state
  const resetMetrics = () => {
    setMetrics(initialMetrics);
  };

  return (
    <BaseContextProvider
      contextName="UserMetrics"
      initializer={initializeMetrics}
      autoInitialize={true}
    >
      {(baseContext) => (
        <UserMetricsContext.Provider 
          value={{
            ...baseContext,
            metrics,
            isLoading: baseContext.status === 'loading',
            updateMetrics,
            resetMetrics
          }}
        >
          {children}
        </UserMetricsContext.Provider>
      )}
    </BaseContextProvider>
  );
};

/**
 * Hook for accessing user metrics context
 */
export const useUserMetricsContext = (): UserMetricsContextType => {
  const context = useContext(UserMetricsContext);
  
  if (!context) {
    throw new Error('useUserMetricsContext must be used within a UserMetricsProvider');
  }
  
  return context;
};
