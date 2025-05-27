
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Enhanced error logging for troubleshooting
const timestamp = () => new Date().toISOString();
const log = (message: string, data?: any) => {
  console.log(`[${timestamp()}] MAIN: ${message}`, data || '');
};

console.log(`[${timestamp()}] MAIN: ===== APPLICATION STARTUP BEGIN =====`);

// Cache-busting: Add timestamp to avoid cached module issues
const cacheBreaker = Date.now();
log(`Application loading with cache breaker: ${cacheBreaker}`);

// Enhanced React module validation
try {
  log("Validating React modules...");
  log(`React version: ${React.version}`);
  log(`React available: ${!!React}`);
  log(`React.createElement available: ${!!React.createElement}`);
  log(`React.useState available: ${!!React.useState}`);
  log(`React.useEffect available: ${!!React.useEffect}`);
  log("✅ React modules validated successfully");
} catch (error) {
  console.error(`[${timestamp()}] MAIN: ❌ React module validation failed:`, error);
}

// Browser environment checks
try {
  log("Checking browser environment...");
  log(`Window available: ${typeof window !== 'undefined'}`);
  log(`Document available: ${typeof document !== 'undefined'}`);
  log(`LocalStorage available: ${typeof localStorage !== 'undefined'}`);
  log("✅ Browser environment validated");
} catch (error) {
  console.error(`[${timestamp()}] MAIN: ❌ Browser environment check failed:`, error);
}

// Mount the app with comprehensive error handling
const mount = () => {
  log("Starting mount process...");
  
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error(`[${timestamp()}] MAIN: ❌ Root element not found`);
    return;
  }
  
  log("✅ Root element found");
  
  try {
    log("Creating React root...");
    const root = createRoot(rootElement);
    log("✅ React root created successfully");
    
    log("Starting React app render...");
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    log("✅ React app render initiated successfully");
    
    // Register service worker for production
    if (import.meta.env.PROD) {
      log('Running in production mode');
    } else {
      log('Running in development mode');
    }
    
  } catch (error) {
    console.error(`[${timestamp()}] MAIN: ❌ Error during React render:`, error);
    console.error(`[${timestamp()}] MAIN: Error details:`, error instanceof Error ? error.message : String(error));
    console.error(`[${timestamp()}] MAIN: Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
    
    // Enhanced fallback rendering with more debugging info
    try {
      log("Attempting fallback error display...");
      const errorDiv = document.createElement('div');
      errorDiv.style.padding = '20px';
      errorDiv.style.color = 'red';
      errorDiv.style.backgroundColor = '#fff';
      errorDiv.style.fontFamily = 'monospace';
      errorDiv.innerHTML = `
        <h2>Application Startup Error</h2>
        <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
        <p><strong>Cache breaker:</strong> ${cacheBreaker}</p>
        <p><strong>Time:</strong> ${timestamp()}</p>
        <details>
          <summary>Stack Trace</summary>
          <pre>${error instanceof Error ? error.stack : 'No stack trace available'}</pre>
        </details>
      `;
      rootElement.appendChild(errorDiv);
      log("✅ Fallback error display created");
    } catch (e) {
      console.error(`[${timestamp()}] MAIN: ❌ Fallback error display failed:`, e);
      // Last resort error handling
      document.body.innerHTML = `
        <div style="padding:20px;color:red;font-family:monospace;">
          <h2>Critical Application Error</h2>
          <p>${error instanceof Error ? error.message : String(error)}</p>
          <p>Time: ${timestamp()}</p>
        </div>
      `;
    }
  }
};

// Global error handlers
window.addEventListener('error', (event) => {
  console.error(`[${timestamp()}] MAIN: ❌ Global error event:`, event.error);
  console.error(`[${timestamp()}] MAIN: Error source: ${event.filename}:${event.lineno}:${event.colno}`);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error(`[${timestamp()}] MAIN: ❌ Unhandled promise rejection:`, event.reason);
});

// Initialize app immediately
log("Starting mount process...");
try {
  mount();
} catch (criticalError) {
  console.error(`[${timestamp()}] MAIN: ❌ CRITICAL: Mount function failed:`, criticalError);
}

log("===== MAIN.TSX EXECUTION COMPLETE =====");
