
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/auth';
import { WorkScheduleProvider } from './contexts/work-schedule';
import { TimesheetSettingsProvider } from './contexts/TimesheetSettingsContext';
import { UserMetricsProvider } from './contexts/user-metrics/UserMetricsContext';
import { ProtectedRoute } from './lib/routeProtection';
import MainLayout from './components/layout/MainLayout';
import Admin from './pages/Admin';
import Timesheet from './pages/Timesheet';
import Manager from './pages/Manager';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import TeamCalendar from './pages/TeamCalendar';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';

function App() {
  return (
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
                {/* Unified timesheet route with optional userId parameter */}
                <Route path="/timesheet/:userId?" element={<ProtectedRoute><Timesheet /></ProtectedRoute>} />
                <Route path="/manager" element={<ProtectedRoute><Manager /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/team-calendar" element={<ProtectedRoute><TeamCalendar /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </UserMetricsProvider>
        </TimesheetSettingsProvider>
      </WorkScheduleProvider>
    </AuthProvider>
  );
}

export default App;
