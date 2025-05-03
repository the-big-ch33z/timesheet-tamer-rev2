
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

// Mount the app with proper browser checks
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
    // Create root and render app
    createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    console.log("App rendered successfully");
    
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
console.log("Starting mount process...");
mount();
