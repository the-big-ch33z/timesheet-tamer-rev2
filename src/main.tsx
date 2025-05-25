// REPLACE src/main.tsx - Use normal imports that work with Lovable's bundler
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Import polyfills
import './utils/react-is-polyfill';
import './utils/prop-types-polyfill';

console.log("=== SIMPLE WORKING MAIN.TSX START ===");

// Validate React is available
const validateReactEnvironment = () => {
  console.log("🔍 Validating React environment...");
  
  const checks = {
    'React': !!React,
    'React.createElement': !!React?.createElement,
    'React.StrictMode': !!React?.StrictMode,
    'React.forwardRef': !!React?.forwardRef,
    'createRoot': !!createRoot,
    'BrowserRouter': !!BrowserRouter,
  };
  
  console.log("React environment checks:", checks);
  
  const failed = Object.entries(checks).filter(([key, value]) => !value);
  if (failed.length > 0) {
    const missingItems = failed.map(([key]) => key).join(', ');
    throw new Error(`Missing React dependencies: ${missingItems}`);
  }
  
  console.log("✅ React environment validation passed");
  return true;
};

// Simple app mounting with retries
const mountApp = async (retryCount = 0) => {
  const maxRetries = 3;
  
  try {
    console.log(`🚀 Mounting app (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Validate React environment
    validateReactEnvironment();
    
    // Get root element
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }
    console.log("✅ Root element found");
    
    // Create React root
    console.log("🏗️ Creating React root...");
    const root = createRoot(rootElement);
    
    // Render app
    console.log("🎨 Rendering app...");
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    
    console.log("🎉 APP MOUNTED SUCCESSFULLY!");
    
    // Hide loading screen if it exists
    setTimeout(() => {
      if (window.hideLoading) {
        window.hideLoading();
      }
    }, 1000);
    
  } catch (error) {
    console.error(`❌ Mount attempt ${retryCount + 1} failed:`, error);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying in 1 second... (${maxRetries - retryCount} attempts left)`);
      setTimeout(() => {
        mountApp(retryCount + 1);
      }, 1000);
    } else {
      console.error("❌ All mount attempts failed, showing error screen");
      showErrorScreen(error);
    }
  }
};

// Show error screen with auto-reload
const showErrorScreen = (error: Error) => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;
  
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
      <div style="
        background: white;
        padding: 32px;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        max-width: 500px;
        text-align: center;
      ">
        <div style="
          width: 48px;
          height: 48px;
          background: #fee2e2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        ">
          ⚠️
        </div>
        <h2 style="color: #dc2626; margin-bottom: 16px;">App Loading Failed</h2>
        <p style="color: #6b7280; margin-bottom: 16px;">
          ${error.message}
        </p>
        <p style="color: #9ca3af; margin-bottom: 24px; font-size: 14px;">
          Auto-reloading in <span id="countdown">5</span> seconds...
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
            margin-right: 8px;
          "
        >
          Reload Now
        </button>
      </div>
    </div>
  `;
  
  // Countdown timer
  let countdown = 5;
  const timer = setInterval(() => {
    countdown--;
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
      countdownEl.textContent = countdown.toString();
    }
    
    if (countdown <= 0) {
      clearInterval(timer);
      window.location.reload();
    }
  }, 1000);
};

// Enhanced error handling
window.addEventListener('error', (event) => {
  if (event.filename && event.filename.includes('chrome-extension://')) {
    return; // Ignore chrome extension errors
  }
  
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Start mounting when DOM is ready
const startApp = () => {
  if (document.readyState === 'loading') {
    console.log("📋 DOM still loading, waiting...");
    document.addEventListener('DOMContentLoaded', () => {
      console.log("📋 DOM ready, starting app...");
      // Small delay to ensure everything is settled
      setTimeout(mountApp, 100);
    });
  } else {
    console.log("📋 DOM already ready, starting app...");
    // Small delay to ensure everything is settled
    setTimeout(mountApp, 100);
  }
};

startApp();
