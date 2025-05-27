
import React, { ReactNode } from 'react';
import { ErrorProvider } from './error/ErrorContext';
import { Toaster } from '@/components/ui/toaster';

// Enhanced logging for AppProvider
const timestamp = () => new Date().toISOString();
const log = (message: string, data?: any) => {
  console.log(`[${timestamp()}] APP_PROVIDER: ${message}`, data || '');
};

export interface AppProviderProps {
  children: ReactNode;
}

/**
 * Main application provider that wraps all other contexts
 * This establishes the context hierarchy and ensures correct initialization order
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  log("===== APP_PROVIDER INITIALIZATION =====");
  
  try {
    log("Initializing ErrorProvider...");
    
    // Use a simpler context structure to avoid circular dependencies
    return (
      <ErrorProvider>
        {(() => {
          log("ErrorProvider initialized, setting up Suspense...");
          return (
            <React.Suspense fallback={
              (() => {
                log("Suspense fallback activated");
                return (
                  <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                );
              })()
            }>
              {(() => {
                log("Rendering children within Suspense");
                return children;
              })()}
            </React.Suspense>
          );
        })()}
        <Toaster />
      </ErrorProvider>
    );
  } catch (error) {
    console.error(`[${timestamp()}] APP_PROVIDER: ❌ Error during AppProvider initialization:`, error);
    
    // Fallback render without context
    return (
      <div className="p-4 text-red-600">
        <h2>AppProvider Error</h2>
        <p>{error instanceof Error ? error.message : String(error)}</p>
        {children}
      </div>
    );
  }
};

export default AppProvider;
