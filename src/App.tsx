
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
import { Toaster } from './components/ui/toaster';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';
import { initializeService } from './utils/time/services/api-wrapper';

// Lazy load pages to improve initial load time
const Timesheet = lazy(() => import('./pages/Timesheet'));
const Admin = lazy(() => import('./pages/Admin'));
const Manager = lazy(() => import('./pages/Manager'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const TeamCalendar = lazy(() => import('./pages/TeamCalendar'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-96">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Global app state tracking
const globalAppState = {
  isInitialized: false,
  loadingStartTime: Date.now(),
  hasErrors: false
};

function App() {
  const [isAppReady, setIsAppReady] = React.useState(false);
  const [initError, setInitError] = React.useState<Error | null>(null);
  
  // Initialize services and monitor app state on startup
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for stored auth data
        const storedUser = localStorage.getItem('currentUser');
        const storedTeams = localStorage.getItem('teams');
        
        // Validate the stored data - this helps catch corrupted localStorage issues
        if (storedUser) {
          try {
            JSON.parse(storedUser);
          } catch (e) {
            console.warn("Corrupted user data detected, clearing...");
            localStorage.removeItem('currentUser');
          }
        }
        
        if (storedTeams) {
          try {
            JSON.parse(storedTeams);
          } catch (e) {
            console.warn("Corrupted teams data detected, clearing...");
            localStorage.removeItem('teams');
          }
        }
        
        // Initialize core services
        await initializeService();
        
        // Mark app as initialized
        globalAppState.isInitialized = true;
        setIsAppReady(true);
      } catch (error) {
        console.error("Failed to initialize application:", error);
        globalAppState.hasErrors = true;
        setInitError(error instanceof Error ? error : new Error('Unknown initialization error'));
        
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
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading application...</p>
      </div>
    );
  }

  // If we have an initialization error, show it
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-2">Application Error</h2>
          <p className="mb-4">There was a problem initializing the application:</p>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
            {initError.message}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <GlobalErrorBoundary>
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
              <Toaster />
            </UserMetricsProvider>
          </TimesheetSettingsProvider>
        </WorkScheduleProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
