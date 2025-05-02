
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { createSeedData } from './utils/seedData';

// Use a web worker for performance intensive tasks if needed
const supportsWorker = typeof Worker !== 'undefined';

// Add protection against module loading errors
const preloadCriticalModules = async () => {
  try {
    // Pre-load critical modules to detect circular dependency issues early
    await Promise.all([
      import('./utils/time/services/toil/storage/core'),
      import('./utils/time/services/toil/storage/queries'),
      import('./utils/time/services/toil/storage/cleanup')
    ]);
    console.log('Critical modules loaded successfully');
    return true;
  } catch (error) {
    console.error('Error preloading critical modules:', error);
    return false;
  }
};

// Mount the app with proper browser checks and error handling
const mount = async () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  // Initialize seed data for first-time users
  try {
    createSeedData();
  } catch (error) {
    console.error("Error initializing seed data:", error);
    // Continue loading app even if seed data fails
  }
  
  // Preload critical modules to catch any circular reference issues early
  const modulesLoaded = await preloadCriticalModules();
  
  try {
    // Create root and render app with error boundary wrapper
    const root = createRoot(rootElement);
    
    // Wrap the app in an error handler to prevent white screens
    root.render(
      <React.StrictMode>
        <ErrorHandler>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ErrorHandler>
      </React.StrictMode>
    );
    
    // Register service worker for production
    if (import.meta.env.PROD) {
      console.log('Running in production mode');
    }
  } catch (error) {
    console.error("Error mounting application:", error);
    // Show a minimal fallback UI instead of white screen
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif;">
          <h2>Application Error</h2>
          <p>Sorry, there was a problem loading the application. Please try refreshing the page.</p>
          <pre style="background: #f1f1f1; padding: 10px; border-radius: 4px;">${error?.message || 'Unknown error'}</pre>
        </div>
      `;
    }
  }
};

// Basic error handler component
const ErrorHandler = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setError(event.error?.toString() || 'Unknown error');
      setHasError(true);
      event.preventDefault();
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
        <h2>Something went wrong</h2>
        <p>The application encountered an error. Please refresh the page to try again.</p>
        {error && <pre style={{ background: '#f1f1f1', padding: '10px' }}>{error}</pre>}
        <button onClick={() => window.location.reload()} style={{ padding: '8px 16px' }}>
          Refresh
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

// Initialize app
mount();
