
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
  // Use a simpler context structure to avoid circular dependencies
  return (
    <ErrorProvider>
      <React.Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
        {children}
      </React.Suspense>
      <Toaster />
    </ErrorProvider>
  );
};

export default AppProvider;
