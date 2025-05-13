
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { createSeedData } from './utils/seedData';

// Initialize polyfills and compatibility layer
import './utils/react-is-polyfill';
import './utils/prop-types-polyfill';

// Enhanced error logging for troubleshooting
console.log("React version:", React.version);
console.log("Application initializing...");

// Mount the app with proper browser checks and error handling
const mount = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  // Initialize seed data for first-time users
  try {
    console.log("Initializing seed data...");
    createSeedData();
    console.log("Seed data initialized successfully");
  } catch (error) {
    console.error("Error initializing seed data:", error);
    // Continue loading app even if seed data fails
  }
  
  try {
    console.log("Creating React root and rendering app...");
    
    // Set up global error handler for React errors
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
    });
    
    // Set up unhandled rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
    
    // Create root and render app with error boundaries
    const root = createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorHandler>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ErrorHandler>
      </React.StrictMode>
    );
    
    console.log("App rendered successfully");
    
    // Register service worker for production
    if (import.meta.env.PROD) {
      console.log('Running in production mode');
    }
  } catch (error) {
    console.error("Error mounting application:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: system-ui, sans-serif;">
        <h2 style="color: #e11d48;">Application Error</h2>
        <p>There was a problem starting the application.</p>
        <pre style="background: #f1f5f9; padding: 10px; border-radius: 4px; overflow: auto;">${
          error instanceof Error ? error.message : String(error)
        }</pre>
      </div>
    `;
  }
};

// Simple error boundary component for catching React rendering errors
function ErrorHandler({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('Error caught by ErrorHandler:', event.error);
      setHasError(true);
      setError(event.error);
    };
    
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
        <h2 style={{ color: "#e11d48" }}>Application Error</h2>
        <p>Something went wrong in the React application.</p>
        {error && (
          <pre style={{ background: "#f1f5f9", padding: "10px", borderRadius: "4px", overflow: "auto" }}>
            {error.message}
          </pre>
        )}
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            marginTop: "10px", 
            padding: "8px 16px", 
            background: "#2563eb", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer" 
          }}
        >
          Reload Application
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

// Initialize app
console.log("Starting mount process...");
mount();
