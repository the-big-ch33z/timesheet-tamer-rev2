// REPLACE src/main.tsx - Debug version to see what's actually available
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Import polyfills
import './utils/react-is-polyfill';
import './utils/prop-types-polyfill';

console.log("=== DEBUG REACT MAIN.TSX START ===");

// Debug React availability
const debugReact = () => {
  console.log("🔍 DEBUGGING REACT AVAILABILITY:");
  console.log("React object:", React);
  console.log("React keys:", Object.keys(React || {}));
  console.log("React.createElement:", typeof React?.createElement);
  console.log("React.StrictMode:", typeof React?.StrictMode);
  console.log("React.forwardRef:", typeof React?.forwardRef);
  console.log("React.useState:", typeof React?.useState);
  console.log("React.useEffect:", typeof React?.useEffect);
  console.log("createRoot:", typeof createRoot);
  console.log("BrowserRouter:", typeof BrowserRouter);
  
  // Try to create a simple element
  try {
    const testElement = React.createElement('div', null, 'Test');
    console.log("✅ React.createElement works:", !!testElement);
  } catch (error) {
    console.log("❌ React.createElement failed:", error);
  }
};

// Simple mounting without strict validation
const mountApp = () => {
  try {
    console.log("🚀 MOUNTING APP - DEBUG VERSION");
    
    // Debug React first
    debugReact();
    
    // Basic checks only
    if (!React) {
      throw new Error("React is not available");
    }
    
    if (!React.createElement) {
      throw new Error("React.createElement is not available");
    }
    
    if (!createRoot) {
      throw new Error("createRoot is not available");
    }
    
    // Get root element
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }
    console.log("✅ Root element found");
    
    // Create React root
    console.log("🏗️ Creating React root...");
    const root = createRoot(rootElement);
    console.log("✅ React root created");
    
    // Try basic render first
    console.log("🎨 Attempting basic render...");
    
    // Use React.createElement instead of JSX to avoid compilation issues
    const StrictModeComponent = React.StrictMode || React.Fragment;
    const appElement = React.createElement(
      StrictModeComponent,
      null,
      React.createElement(
        BrowserRouter,
        null,
        React.createElement(App)
      )
    );
    
    root.render(appElement);
    
    console.log("🎉 APP RENDERED SUCCESSFULLY!");
    
    // Hide loading screen
    setTimeout(() => {
      if (window.hideLoading) {
        window.hideLoading();
      }
    }, 1000);
    
  } catch (error) {
    console.error("❌ MOUNT FAILED:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Show the actual error instead of retrying
    showDebugError(error);
  }
};

// Show debug error screen
const showDebugError = (error: Error) => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;
  
  // Hide loading screen first
  if (window.hideLoading) {
    window.hideLoading();
  }
  
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-family: 'Courier New', monospace;
      background: #1a1a1a;
      color: #ffffff;
      padding: 20px;
    ">
      <div style="
        background: #2a2a2a;
        padding: 32px;
        border-radius: 8px;
        border: 1px solid #444;
        max-width: 800px;
        width: 100%;
      ">
        <h2 style="color: #ff6b6b; margin-bottom: 16px; font-family: system-ui;">
          🚨 React Debug Error
        </h2>
        <div style="margin-bottom: 20px;">
          <strong style="color: #ffd93d;">Error Message:</strong>
          <pre style="
            background: #1a1a1a;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 8px 0;
            border: 1px solid #444;
            color: #ff6b6b;
          ">${error.message}</pre>
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong style="color: #ffd93d;">Available React Properties:</strong>
          <pre style="
            background: #1a1a1a;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 8px 0;
            border: 1px solid #444;
            color: #6bcf7f;
            font-size: 12px;
          ">React: ${typeof React}
React keys: ${Object.keys(React || {}).join(', ')}
React.createElement: ${typeof React?.createElement}
React.StrictMode: ${typeof React?.StrictMode}
React.forwardRef: ${typeof React?.forwardRef}
createRoot: ${typeof createRoot}
BrowserRouter: ${typeof BrowserRouter}</pre>
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong style="color: #ffd93d;">Stack Trace:</strong>
          <pre style="
            background: #1a1a1a;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 8px 0;
            border: 1px solid #444;
            color: #c7c7c7;
            font-size: 11px;
            max-height: 200px;
          ">${error.stack || 'No stack trace available'}</pre>
        </div>
        
        <div style="text-align: center;">
          <button 
            onclick="window.location.reload()" 
            style="
              background: #6bcf7f; 
              color: #1a1a1a; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 6px; 
              cursor: pointer;
              font-weight: bold;
              margin-right: 12px;
            "
          >
            🔄 Reload Page
          </button>
          <button 
            onclick="console.clear(); ${debugReact.toString()}(); debugReact();" 
            style="
              background: #4dabf7; 
              color: #1a1a1a; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 6px; 
              cursor: pointer;
              font-weight: bold;
            "
          >
            🔍 Debug in Console
          </button>
        </div>
      </div>
    </div>
  `;
};

// Enhanced error handling
window.addEventListener('error', (event) => {
  if (event.filename && event.filename.includes('chrome-extension://')) {
    return;
  }
  console.error('Global error:', event.error);
});

// Start the app
console.log("📋 Starting debug app...");
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
