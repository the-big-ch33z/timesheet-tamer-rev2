
import React, { ReactNode } from 'react';
import { ErrorProvider } from './error/ErrorContext';
import { Toaster } from '@/components/ui/toaster';

export interface AppProviderProps {
  children: ReactNode;
}

/**
 * Main application provider that wraps all other contexts
 * This establishes the context hierarchy and ensures correct initialization order
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ErrorProvider>
      {/* Add other base-level providers here */}
      {children}
      <Toaster />
    </ErrorProvider>
  );
};

export default AppProvider;
