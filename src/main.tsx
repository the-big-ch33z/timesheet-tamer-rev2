import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Initialize polyfills and compatibility layer
import './utils/react-is-polyfill';
import './utils/prop-types-polyfill';

// Enhanced debugging for Lovable environment
console.log("=== LOVABLE INITIALIZATION START ===");
console.log("React version:", React.version);
console.log("Document ready state:", document.readyState);
console.log("GPT Engineer script present:", !!document.querySelector('script[src*="gptengineer"]'));

// Global error handling specific to Lovable
window.addEventListener('error', (event) => {
  // Filter out chrome extension errors that don't affect our app
  if (event.filename && event.filename.includes('chrome-extension://')) {
    console.warn('Chrome extension error (ignored):', event.message);
    return;
  }
  console.error('Application error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Lovable-specific initialization function
const initializeLovableApp = async () => {
  console.log("Starting Lovable app initialization...");
  
  // Wait for Lovable's gptengineer script to be ready
  const waitForLovableScript = () => {
    return new Promise<void>((resolve) => {
      const maxWait = 100; // 10 seconds max
      let attempts = 0;
      
      const checkScript = () => {
        attempts++;
        
        // Check for the script tag
        const scriptExists = !!document.querySelector('script[src*="gptengineer"]');
        
        // Check if DOM is ready
        const domReady = document.readyState === 'complete' || document.readyState === 'interactive';
        
        console.log(`Lovable check ${attempts}: script=${scriptExists}, dom=${domReady}`);
        
        if (scriptExists && domReady) {
          console.log("Lovable environment ready!");
          resolve();
          return;
        }
        
        if (attempts >= maxWait) {
          console.warn("Max wait time reached, proceeding anyway...");
          resolve();
          return;
        }
        
        setTimeout(checkScript, 100);
      };
      
      checkScript();
    });
  };

  // Wait for Lovable environment
  await waitForLovableScript();
  
  // Additional small delay to ensure everything is settled
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return true;
};

// Mount function with Lovable-specific logic
const mountApp = async () => {
  try {
    console.log("Preparing to mount React app...");
    
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }

    // Wait for Lovable to be ready
    await initializeLovableApp();
    
    console.log("Creating React root...");
    const root = createRoot(rootElement);
    
    console.log("Rendering app...");
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    
    console.log("=== APP MOUNTED SUCCESSFULLY ===");
    
  } catch (error) {
    console.error("=== MOUNT ERROR ===", error);
    
    // Show error in the UI
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          min-height: 100vh; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-family: system-ui, sans-serif;
          background: #f9fafb;
          padding: 20px;
        ">
          <div style="text-align: center; max-width: 500px;">
            <h2 style="color: #dc2626; margin-bottom: 16px;">Application Failed to Load</h2>
            <p style="color: #6b7280; margin-bottom: 16px;">
              There was an error initializing the Lovable application.
            </p>
            <details style="margin-bottom: 16px; text-align: left;">
              <summary style="cursor: pointer; color: #374151;">Error Details</summary>
              <pre style="
                background: #f3f4f6; 
                padding: 12px; 
                border-radius: 4px; 
                overflow: auto; 
                font-size: 12px;
                margin-top: 8px;
              ">${error.message}</pre>
            </details>
            <button 
              onclick="window.location.reload()" 
              style="
                background: #3b82f6; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 6px; 
                cursor: pointer;
                font-size: 14px;
              "
            >
              Reload Application
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Enhanced DOM ready detection for Lovable
const startApp = () => {
  if (document.readyState === 'loading') {
    console.log("DOM still loading, waiting...");
    document.addEventListener('DOMContentLoaded', () => {
      console.log("DOM loaded, starting app...");
      mountApp();
    });
  } else {
    console.log("DOM already ready, starting app immediately...");
    mountApp();
  }
};

// Start the application
console.log("Initiating app startup...");
startApp();
