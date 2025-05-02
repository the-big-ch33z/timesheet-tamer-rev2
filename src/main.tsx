
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { createSeedData } from './utils/seedData';

// Explicitly set React on window for legacy components that might access it directly
// This helps with libraries that expect React to be globally available
if (typeof window !== 'undefined') {
  window.React = React;
}

// Use a web worker for performance intensive tasks if needed
const supportsWorker = typeof Worker !== 'undefined';

// Mount the app with proper browser checks
const mount = () => {
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
  
  try {
    // Create root and render app
    createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    
    // Register service worker for production
    if (import.meta.env.PROD) {
      // This would be where we'd register a service worker if needed
      console.log('Running in production mode');
    }
  } catch (error) {
    console.error("Error mounting application:", error);
  }
};

// Initialize app
mount();
