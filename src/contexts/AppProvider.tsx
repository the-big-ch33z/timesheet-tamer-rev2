
import React, { ReactNode } from 'react';
import { ErrorProvider } from './error/ErrorContext';
import { Toaster } from '@/components/ui/toaster';
import { UserMetricsProvider } from './user-metrics/UserMetricsContext';

export interface AppProviderProps {
  children: ReactNode;
}

/**
 * Main application provider that wraps all other contexts
 * This establishes the context hierarchy and ensures correct initialization order
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  console.log("Initializing AppProvider");
  
  return (
    <ErrorProvider>
      <UserMetricsProvider>
        {children}
        <Toaster />
      </UserMetricsProvider>
    </ErrorProvider>
  );
};

export default AppProvider;
