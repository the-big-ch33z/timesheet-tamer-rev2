// REPLACE your src/main.tsx with this simplified version
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Import polyfills
import './utils/react-is-polyfill';
import './utils/prop-types-polyfill';

console.log("=== SIMPLIFIED MAIN.TSX START ===");

// Simple mounting function
const mountApp = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  try {
    console.log("✅ Creating React root...");
    const root = createRoot(rootElement);
    
    console.log("✅ Rendering app...");
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    
    console.log("✅ App rendered successfully");
    
  } catch (error) {
    console.error("❌ Failed to mount app:", error);
    
    // Show basic error message
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
        <div style="text-align: center;">
          <h2 style="color: #dc2626; margin-bottom: 16px;">App Failed to Load</h2>
          <p style="color: #6b7280; margin-bottom: 16px;">
            React mounting failed. The page will reload automatically.
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
            "
          >
            Reload Now
          </button>
        </div>
      </div>
    `;
    
    // Auto-reload after 2 seconds
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
};

// Mount when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
