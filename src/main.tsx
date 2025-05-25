// REPLACE your entire src/main.tsx with this simple solution
// This automatically does what the "edit" button does

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Initialize polyfills
import './utils/react-is-polyfill';
import './utils/prop-types-polyfill';

console.log("=== SIMPLE AUTO-RELOAD FIX START ===");

// Auto-reload function that mimics the edit button
const autoReloadIfNeeded = () => {
  let hasReloaded = false;
  
  // Check if we're in Lovable iframe
  const isInLovableIframe = () => {
    try {
      return window.self !== window.top && (
        window.location.hostname.includes('lovableproject.com') ||
        window.location.href.includes('lovable') ||
        document.querySelector('script[src*="gptengineer"]') !== null
      );
    } catch (e) {
      return false;
    }
  };

  // Function to force reload (what edit button does)
  const forceReload = () => {
    if (hasReloaded) return; // Prevent infinite loops
    hasReloaded = true;
    
    console.log("🔄 Forcing reload (simulating edit button)...");
    
    // Method 1: Standard page reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Monitor for React loading failures
  const monitorReactLoading = () => {
    let checkCount = 0;
    const maxChecks = 30; // 3 seconds
    
    const checkReactStatus = () => {
      checkCount++;
      
      // Check if React loaded successfully
      const rootElement = document.getElementById('root');
      const hasContent = rootElement && rootElement.innerHTML.trim().length > 0;
      const reactAvailable = typeof React !== 'undefined' && React.createElement;
      
      console.log(`Check ${checkCount}: React=${reactAvailable}, Content=${hasContent}`);
      
      // If we've checked for 3 seconds and no content, reload
      if (checkCount >= maxChecks && !hasContent && isInLovableIframe()) {
        console.log("❌ React failed to load content after 3 seconds, triggering reload...");
        forceReload();
        return;
      }
      
      // If React isn't available after 2 seconds, reload
      if (checkCount >= 20 && !reactAvailable && isInLovableIframe()) {
        console.log("❌ React not available after 2 seconds, triggering reload...");
        forceReload();
        return;
      }
      
      // Continue checking if we haven't maxed out
      if (checkCount < maxChecks && !hasContent) {
        setTimeout(checkReactStatus, 100);
      } else if (hasContent) {
        console.log("✅ React loaded successfully!");
      }
    };
    
    // Start monitoring after a brief delay
    setTimeout(checkReactStatus, 500);
  };

  // Error handler that triggers reload on critical errors
  const handleCriticalError = (error: any) => {
    const errorString = error?.toString() || '';
    const isCritical = 
      errorString.includes('forwardRef') ||
      errorString.includes('insertBefore') ||
      errorString.includes('Failed to fetch') ||
      errorString.includes('Loading chunk');
    
    if (isCritical && isInLovableIframe()) {
      console.log("❌ Critical React error detected, triggering reload...", error);
      forceReload();
    }
  };

  // Set up error monitoring
  window.addEventListener('error', (event) => {
    // Ignore chrome extension errors
    if (event.filename?.includes('chrome-extension://')) return;
    handleCriticalError(event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    handleCriticalError(event.reason);
  });

  // Start monitoring
  if (isInLovableIframe()) {
    console.log("🔍 Detected Lovable iframe, starting auto-reload monitoring...");
    monitorReactLoading();
  }
};

// Standard app mounting function
const mountApp = () => {
  try {
    console.log("🚀 Mounting React app...");
    
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }

    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    
    console.log("✅ React app mounted successfully!");
    
  } catch (error) {
    console.error("❌ Failed to mount React app:", error);
    throw error;
  }
};

// Main initialization
const initialize = () => {
  console.log("🔧 Initializing application...");
  
  // Start auto-reload monitoring immediately
  autoReloadIfNeeded();
  
  // Mount the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
  } else {
    mountApp();
  }
};

// Start initialization
initialize();
