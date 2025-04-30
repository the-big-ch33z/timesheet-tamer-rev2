
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

// Initialize services on app start
React.useEffect(() => {
  initializeService().catch(error => 
    console.error("Failed to initialize services:", error)
  );
}, []);

function App() {
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
