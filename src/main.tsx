// Add this to your src/main.tsx - REPLACE the existing content entirely

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Initialize polyfills and compatibility layer
import './utils/react-is-polyfill';
import './utils/prop-types-polyfill';

console.log("=== FORCE REFRESH SOLUTION START ===");

// Force refresh the parent iframe if we detect we're in Lovable
const forceRefreshLovablePreview = () => {
  try {
    // Check if we're in an iframe (Lovable preview)
    const isInIframe = window.self !== window.top;
    const isLovable = window.location.hostname.includes('lovableproject.com') || 
                     window.location.hostname.includes('lovable.dev') ||
                     document.referrer.includes('lovable');
    
    console.log("Is in iframe:", isInIframe);
    console.log("Is Lovable environment:", isLovable);
    
    if (isInIframe && isLovable) {
      console.log("Detected Lovable iframe, attempting forced refresh...");
      
      // Try multiple methods to force refresh
      setTimeout(() => {
        // Method 1: Force location reload
        if (window.location.href.includes('#')) {
          window.location.href = window.location.href.split('#')[0];
        } else {
          window.location.href = window.location.href + '#refresh-' + Date.now();
        }
      }, 100);
      
      // Method 2: PostMessage to parent
      try {
        window.parent.postMessage({
          type: 'LOVABLE_FORCE_REFRESH',
          timestamp: Date.now()
        }, '*');
      } catch (e) {
        console.log("PostMessage failed:", e);
      }
      
      // Method 3: Force document refresh
      setTimeout(() => {
        document.location.reload(true);
      }, 200);
    }
  } catch (error) {
    console.log("Refresh attempt failed:", error);
  }
};

// Enhanced error handling for Lovable
window.addEventListener('error', (event) => {
  if (event.filename && event.filename.includes('chrome-extension://')) {
    return; // Ignore chrome extension errors
  }
  
  console.error('Application error:', event.error);
  
  // If we get a critical error and we're in Lovable, try to force refresh
  if (event.message.includes('Failed to fetch') || 
      event.message.includes('Loading chunk') ||
      event.message.includes('import statement')) {
    console.log("Critical error detected, attempting force refresh...");
    forceRefreshLovablePreview();
  }
});

// Global unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // If it's a module loading error, try force refresh
  if (event.reason && event.reason.toString().includes('Failed to fetch')) {
    console.log("Module loading error, attempting force refresh...");
    forceRefreshLovablePreview();
  }
});

// Function to initialize the app with force refresh capability
const initializeWithForceRefresh = async () => {
  console.log("Starting app with force refresh capability...");
  
  // Wait for DOM
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }
  
  // Check for gptengineer script with timeout
  let attempts = 0;
  while (attempts < 30) { // 3 seconds max
    const scriptExists = document.querySelector('script[src*="gptengineer"]');
    if (scriptExists) {
      console.log("GPT Engineer script found");
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  // If no script found after timeout, force refresh
  if (attempts >= 30) {
    console.log("GPT Engineer script not found, forcing refresh...");
    forceRefreshLovablePreview();
    return;
  }
  
  // Additional wait for script to be ready
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return true;
};

// Mount function with force refresh
const mountApp = async () => {
  try {
    console.log("Preparing to mount with force refresh...");
    
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }

    // Initialize with force refresh capability
    await initializeWithForceRefresh();
    
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
    
    console.log("=== APP MOUNTED WITH FORCE REFRESH ===");
    
    // Set a flag that we've successfully mounted
    (window as any).LOVABLE_APP_MOUNTED = true;
    
  } catch (error) {
    console.error("=== MOUNT ERROR - ATTEMPTING FORCE REFRESH ===", error);
    
    // Critical mount error - force refresh
    forceRefreshLovablePreview();
    
    // Also show error UI as fallback
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
            <div style="margin-bottom: 20px;">
              <div style="
                width: 40px;
                height: 40px;
                border: 4px solid #e5e7eb;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
              "></div>
            </div>
            <h2 style="color: #dc2626; margin-bottom: 16px;">Loading Failed - Attempting Refresh</h2>
            <p style="color: #6b7280; margin-bottom: 16px;">
              The Lovable preview failed to load. Attempting to force refresh...
            </p>
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
              Manual Reload
            </button>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
    }
  }
};

// Enhanced startup with force refresh
const startAppWithForceRefresh = () => {
  console.log("Starting app with force refresh capability...");
  
  // Check if we've already mounted (prevent double mounting)
  if ((window as any).LOVABLE_APP_MOUNTED) {
    console.log("App already mounted, skipping...");
    return;
  }
  
  if (document.readyState === 'loading') {
    console.log("DOM still loading, waiting...");
    document.addEventListener('DOMContentLoaded', () => {
      console.log("DOM loaded, mounting with force refresh...");
      mountApp();
    });
  } else {
    console.log("DOM ready, mounting immediately with force refresh...");
    mountApp();
  }
};

// Detect if we're getting stuck and need a force refresh
let startTime = Date.now();
setTimeout(() => {
  if (!(window as any).LOVABLE_APP_MOUNTED) {
    console.log("App failed to mount within 5 seconds, forcing refresh...");
    forceRefreshLovablePreview();
  }
}, 5000);

// Start the application
console.log("Initiating app startup with force refresh...");
startAppWithForceRefresh();
