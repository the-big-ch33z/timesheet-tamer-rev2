
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useErrorContext } from '../error/ErrorContext';
import { useContextInitialization, InitializationStatus } from '@/hooks/useContextInitialization';
import { useLogger } from '@/hooks/useLogger';

// Base context interface that all other contexts will extend
export interface BaseContextState {
  status: InitializationStatus;
  isInitialized: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  reset: () => void;
}

// Create the base context
const BaseContext = createContext<BaseContextState | undefined>(undefined);

export interface BaseContextProviderProps {
  children: ReactNode;
  contextName: string;
  initializer: () => Promise<any>;
  autoInitialize?: boolean;
}

/**
 * Base Context Provider
 * Provides shared initialization logic for all contexts
 */
export const BaseContextProvider: React.FC<BaseContextProviderProps> = ({
  children,
  contextName,
  initializer,
  autoInitialize = true
}) => {
  const logger = useLogger(`${contextName}Context`);
  const { handleError } = useErrorContext();
  
  // Use the standard initialization hook
  const {
    status,
    isInitialized,
    initialize: initializeBase,
    reset
  } = useContextInitialization(
    initializer,
    contextName,
    {
      onError: (error) => {
        handleError(error, `${contextName} initialization`);
      }
    }
  );
  
  // Wrap initialize to catch any errors
  const initialize = async () => {
    try {
      logger.debug(`Initializing ${contextName} context...`);
      await initializeBase();
      logger.debug(`${contextName} context initialized successfully`);
    } catch (error) {
      logger.error(`Error initializing ${contextName} context:`, error);
      handleError(error instanceof Error ? error : String(error), `${contextName} context initialization`);
      throw error;
    }
  };
  
  // Auto-initialize if enabled
  React.useEffect(() => {
    if (autoInitialize && status === 'idle') {
      initialize().catch((error) => {
        logger.error(`Auto-initialization of ${contextName} failed:`, error);
      });
    }
  }, [autoInitialize]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const contextValue: BaseContextState = {
    status,
    isInitialized,
    isLoading: status === 'loading',
    initialize,
    reset
  };

  return (
    <BaseContext.Provider value={contextValue}>
      {children}
    </BaseContext.Provider>
  );
};

/**
 * Hook to access base context state
 * This is used by derived contexts to access initialization state
 */
export const useBaseContext = (): BaseContextState => {
  const context = useContext(BaseContext);
  
  if (context === undefined) {
    throw new Error('useBaseContext must be used within a BaseContextProvider');
  }
  
  return context;
};

/**
 * Base context creator function
 * This helps to create context types with proper initialization state
 */
export function createBaseContextType<T>() {
  return createContext<(T & BaseContextState) | undefined>(undefined);
}

/**
 * Higher-order component to provide base context functionality
 */
export function withBaseContext<P extends BaseContextState>(Component: React.ComponentType<P>) {
  return (props: Omit<P, keyof BaseContextState>) => {
    const baseContext = useBaseContext();
    
    // Combine base context with component props
    const combinedProps = {
      ...props,
      ...baseContext
    } as P;
    
    return <Component {...combinedProps} />;
  };
}
