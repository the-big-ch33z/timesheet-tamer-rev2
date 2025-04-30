
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { createSeedData } from './utils/seedData';

// Use a web worker for performance intensive tasks if needed
const supportsWorker = typeof Worker !== 'undefined';

// Mount the app with proper browser checks
const mount = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  // Initialize seed data for first-time users
  createSeedData();
  
  // Create root and render app
  createRoot(rootElement).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  
  // Register service worker for production
  if (import.meta.env.PROD) {
    // This would be where we'd register a service worker if needed
    console.log('Running in production mode');
  }
};

// Initialize app
mount();
