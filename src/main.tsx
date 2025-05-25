
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Cache-busting: Add timestamp to avoid cached module issues
const cacheBreaker = Date.now();
console.log(`Application loading with cache breaker: ${cacheBreaker}`);

// Enhanced error logging for troubleshooting
console.log("React version:", React.version);
console.log("React available?", !!React);
console.log("React.createElement available?", !!React.createElement);
console.log("React.useState available?", !!React.useState);
console.log("Application initializing...");

// Mount the app with proper browser checks
const mount = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found");
    return;
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
      console.log('Running in production mode');
    }
  } catch (error) {
    console.error("Error mounting application:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    
    // Fallback rendering to show error to user
    try {
      const errorDiv = document.createElement('div');
      errorDiv.style.padding = '20px';
      errorDiv.style.color = 'red';
      errorDiv.style.backgroundColor = '#fff';
      errorDiv.innerHTML = `<h2>Application Error</h2><p>${error.message}</p><p>Cache breaker: ${cacheBreaker}</p>`;
      rootElement.appendChild(errorDiv);
    } catch (e) {
      // Last resort error handling
      document.body.innerHTML = `<div style="padding:20px;color:red;"><h2>Application Error</h2><p>${error.message}</p></div>`;
    }
  }
};

// Initialize app immediately
console.log("Starting mount process...");
mount();
