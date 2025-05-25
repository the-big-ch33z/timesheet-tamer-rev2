// REPLACE your src/main.tsx - this waits for React to be ready before doing anything
console.log("=== WAIT FOR REACT MAIN.TSX START ===");

// Wait for React to be fully available before importing anything else
const waitForReact = async (): Promise<any> => {
  console.log("🔍 Checking for React availability...");
  
  let attempts = 0;
  while (attempts < 50) { // 5 seconds max
    try {
      // Try to dynamically import React
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');
      
      if (React.default && React.default.createElement && ReactDOM.createRoot) {
        console.log("✅ React is ready!");
        return { React: React.default, ReactDOM };
      }
    } catch (error) {
      console.log(`🔄 React not ready yet (attempt ${attempts + 1}/50):`, error.message);
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error("React failed to load after 5 seconds");
};

// Main application initialization
const initializeApp = async () => {
  try {
    // Step 1: Wait for React
    const { React, ReactDOM } = await waitForReact();
    console.log("✅ React dependencies confirmed");
    
    // Step 2: Import CSS and polyfills
    console.log("📦 Loading styles and polyfills...");
    await import('./index.css');
    await import('./utils/react-is-polyfill');
    await import('./utils/prop-types-polyfill');
    console.log("✅ Styles and polyfills loaded");
    
    // Step 3: Import remaining dependencies
    console.log("📦 Loading React Router...");
    const { BrowserRouter } = await import('react-router-dom');
    console.log("✅ React Router loaded");
    
    // Step 4: Import App component
    console.log("📦 Loading App component...");
    const AppModule = await import('./App.tsx');
    const App = AppModule.default;
    console.log("✅ App component loaded");
    
    // Step 5: Get root element
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }
    console.log("✅ Root element found");
    
    // Step 6: Create React root and render
    console.log("🚀 Creating React root...");
    const root = ReactDOM.createRoot(rootElement);
    
    console.log("🎨 Rendering application...");
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(BrowserRouter, null,
          React.createElement(App)
        )
      )
    );
    
    console.log("🎉 APPLICATION RENDERED SUCCESSFULLY!");
    
  } catch (error) {
    console.error("❌ App initialization failed:", error);
    
    // Show error message
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
          <div style="
            background: white;
            padding: 32px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            text-align: center;
          ">
            <h2 style="color: #dc2626; margin-bottom: 16px;">React Loading Error</h2>
            <p style="color: #6b7280; margin-bottom: 16px;">
              ${error.message}
            </p>
            <p style="color: #9ca3af; margin-bottom: 24px; font-size: 14px;">
              The page will reload automatically in 3 seconds.
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
      
      // Auto-reload after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }
};

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
