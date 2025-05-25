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

// Lazy load pages to improve initial load time
const Timesheet = lazy(() => import('./pages/Timesheet'));
const Admin = lazy(() => import('./pages/Admin'));
const Manager = lazy(() => import('./pages/Manager'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const TeamCalendar = lazy(() => import('./pages/TeamCalendar'));

// Enhanced loading fallback component for Lovable
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-96">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// App initialization state management
const useAppInitialization = () => {
  const [isAppReady, setIsAppReady] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      try {
        console.log("=== APP COMPONENT INITIALIZATION START ===");
        
        // Clean up any corrupted localStorage data
        const cleanupStorage = () => {
          try {
            const storedUser = localStorage.getItem('currentUser');
            const storedTeams = localStorage.getItem('teams');
            
            if (storedUser) {
              JSON.parse(storedUser);
            }
            if (storedTeams) {
              JSON.parse(storedTeams);
            }
          } catch (e) {
            console.warn("Corrupted localStorage detected, cleaning up...");
            localStorage.removeItem('currentUser');
            localStorage.removeItem('teams');
          }
        };
        
        cleanupStorage();
        
        // Run data format validation
        console.log("Validating storage format...");
        await validateStorageFormat();
        
        // Initialize core services
        console.log("Initializing services...");
        await initializeService();
        
        // Create seed data only once (removed from main.tsx)
        console.log("Creating seed data...");
        createSeedData(false);
        
        console.log("=== APP INITIALIZATION COMPLETE ===");
        
        if (isMounted) {
          setIsAppReady(true);
        }
        
      } catch (error) {
        console.error("=== APP INITIALIZATION ERROR ===", error);
        
        if (isMounted) {
          setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
          setIsAppReady(true); // Still set ready so we can show error UI
        }
      }
    };
    
    // Small delay to ensure Lovable environment is fully ready
    const initTimer = setTimeout(initializeApp, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(initTimer);
    };
  }, []);
  
  return { isAppReady, initError };
};

function App() {
  const { isAppReady, initError } = useAppInitialization();

  // Show loading screen while app initializes
  if (!isAppReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Initializing application...</p>
        <p className="text-sm text-gray-400 mt-2">Please wait...</p>
      </div>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Initialization Error</h2>
          <p className="text-gray-600 mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

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

export default App;
