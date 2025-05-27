
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/auth';
import { WorkScheduleProvider } from './contexts/work-schedule';
import { TimesheetSettingsProvider } from './contexts/TimesheetSettingsContext';
import { UserMetricsProvider } from './contexts/user-metrics/UserMetricsContext';
import { ProtectedRoute } from './lib/routeProtection';
import MainLayout from './components/layout/MainLayout';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import { AppProvider } from './contexts/AppProvider';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';
import { initializeService } from './utils/time/services/api-wrapper';
import { createSeedData, validateStorageFormat } from './utils/seedData';
import ErrorBoundary from './components/common/ErrorBoundary';

// Enhanced logging for App component
const timestamp = () => new Date().toISOString();
const log = (message: string, data?: any) => {
  console.log(`[${timestamp()}] APP: ${message}`, data || '');
};

console.log(`[${timestamp()}] APP: ===== APP COMPONENT INITIALIZATION =====`);

// Lazy load pages to improve initial load time
const Timesheet = lazy(() => {
  log("Loading Timesheet component...");
  return import('./pages/Timesheet').then(module => {
    log("✅ Timesheet component loaded successfully");
    return module;
  }).catch(error => {
    console.error(`[${timestamp()}] APP: ❌ Failed to load Timesheet component:`, error);
    throw error;
  });
});

const Admin = lazy(() => {
  log("Loading Admin component...");
  return import('./pages/Admin').then(module => {
    log("✅ Admin component loaded successfully");
    return module;
  }).catch(error => {
    console.error(`[${timestamp()}] APP: ❌ Failed to load Admin component:`, error);
    throw error;
  });
});

const Manager = lazy(() => {
  log("Loading Manager component...");
  return import('./pages/Manager').then(module => {
    log("✅ Manager component loaded successfully");
    return module;
  }).catch(error => {
    console.error(`[${timestamp()}] APP: ❌ Failed to load Manager component:`, error);
    throw error;
  });
});

const Reports = lazy(() => {
  log("Loading Reports component...");
  return import('./pages/Reports').then(module => {
    log("✅ Reports component loaded successfully");
    return module;
  }).catch(error => {
    console.error(`[${timestamp()}] APP: ❌ Failed to load Reports component:`, error);
    throw error;
  });
});

const Settings = lazy(() => {
  log("Loading Settings component...");
  return import('./pages/Settings').then(module => {
    log("✅ Settings component loaded successfully");
    return module;
  }).catch(error => {
    console.error(`[${timestamp()}] APP: ❌ Failed to load Settings component:`, error);
    throw error;
  });
});

const TeamCalendar = lazy(() => {
  log("Loading TeamCalendar component...");
  return import('./pages/TeamCalendar').then(module => {
    log("✅ TeamCalendar component loaded successfully");
    return module;
  }).catch(error => {
    console.error(`[${timestamp()}] APP: ❌ Failed to load TeamCalendar component:`, error);
    throw error;
  });
});

// Loading fallback component
const LoadingFallback = () => {
  log("LoadingFallback component rendered");
  return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

// Global app state tracking
const globalAppState = {
  isInitialized: false,
  loadingStartTime: Date.now(),
  hasErrors: false
};

function App() {
  log("===== APP COMPONENT FUNCTION STARTED =====");
  
  const [isAppReady, setIsAppReady] = React.useState(false);
  
  // Initialize services and monitor app state on startup
  React.useEffect(() => {
    log("App useEffect initialization started");
    
    const initializeApp = async () => {
      try {
        log("Starting app initialization process...");
        
        // Check for stored auth data
        log("Checking localStorage for auth data...");
        const storedUser = localStorage.getItem('currentUser');
        const storedTeams = localStorage.getItem('teams');
        
        // Validate the stored data - this helps catch corrupted localStorage issues
        if (storedUser) {
          try {
            JSON.parse(storedUser);
            log("✅ Stored user data is valid JSON");
          } catch (e) {
            console.warn(`[${timestamp()}] APP: ⚠️ Corrupted user data detected, clearing...`);
            localStorage.removeItem('currentUser');
          }
        }
        
        if (storedTeams) {
          try {
            JSON.parse(storedTeams);
            log("✅ Stored teams data is valid JSON");
          } catch (e) {
            console.warn(`[${timestamp()}] APP: ⚠️ Corrupted teams data detected, clearing...`);
            localStorage.removeItem('teams');
          }
        }
        
        // Run data format validation and fix any issues
        log("Starting storage format validation...");
        await validateStorageFormat();
        log("✅ Storage format validation completed");
        
        // Initialize core services
        log("Initializing core services...");
        await initializeService();
        log("✅ Core services initialized");
        
        // Only create seed data if needed - with false to ensure no demo data is created
        log("Creating seed data if needed...");
        createSeedData(false);
        log("✅ Seed data creation completed");
        
        // Mark app as initialized
        globalAppState.isInitialized = true;
        log("✅ App initialization complete");
        setIsAppReady(true);
        
      } catch (error) {
        console.error(`[${timestamp()}] APP: ❌ Failed to initialize application:`, error);
        console.error(`[${timestamp()}] APP: Error details:`, error instanceof Error ? error.message : String(error));
        console.error(`[${timestamp()}] APP: Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
        globalAppState.hasErrors = true;
        
        // Still mark app as ready so we can show error UI
        setIsAppReady(true);
      }
    };
    
    // Start initialization
    initializeApp();
    
    // Set up error monitoring
    const originalConsoleError = console.error;
    console.error = function(...args) {
      globalAppState.hasErrors = true;
      originalConsoleError.apply(this, args);
    };
    
    // Cleanup
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Show a loading indicator while the app initializes
  if (!isAppReady) {
    log("Rendering app loading state");
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading application...</p>
      </div>
    );
  }

  log("Starting main app render with providers...");

  return (
    <GlobalErrorBoundary>
      <AppProvider>
        <ErrorBoundary>
          <AuthProvider>
            <WorkScheduleProvider>
              <TimesheetSettingsProvider>
                <UserMetricsProvider>
                  <Routes>
                    {/* Redirect root to login */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Auth mode="login" />} />
                    <Route path="/signup" element={<Auth mode="signup" />} />
                    
                    {/* Protected routes with layout */}
                    <Route element={<MainLayout />}>
                      {/* Wrap lazy-loaded components with Suspense */}
                      <Route path="/timesheet/:userId?" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingFallback />}>
                            <Timesheet />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/manager" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingFallback />}>
                            <Manager />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/reports" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingFallback />}>
                            <Reports />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/team-calendar" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingFallback />}>
                            <TeamCalendar />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingFallback />}>
                            <Settings />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin" element={
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingFallback />}>
                            <Admin />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                    </Route>
                    
                    {/* 404 route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </UserMetricsProvider>
              </TimesheetSettingsProvider>
            </WorkScheduleProvider>
          </AuthProvider>
        </ErrorBoundary>
      </AppProvider>
    </GlobalErrorBoundary>
  );
}

log("===== APP COMPONENT EXPORT =====");
export default App;
