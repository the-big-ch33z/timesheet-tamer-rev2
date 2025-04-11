import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/auth';
import { WorkScheduleProvider } from './contexts/work-schedule';
import { TimesheetSettingsProvider } from './contexts/TimesheetSettingsContext';
import { ProtectedRoute } from './lib/routeProtection';
import MainLayout from './components/layout/MainLayout';
import Admin from './pages/Admin';
import Timesheet from './pages/Timesheet';
import Manager from './pages/Manager';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import TeamCalendar from './pages/TeamCalendar';
import Auth from './pages/Auth';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import ScheduleSettings from './pages/ScheduleSettings';
import PublicRoute from './lib/publicRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkScheduleProvider>
          <TimesheetSettingsProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route 
                path="/auth" 
                element={
                  <PublicRoute>
                    <Auth />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/timesheet/:userId?" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Timesheet />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/team-calendar" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TeamCalendar />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manager" 
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <MainLayout>
                      <Manager />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <MainLayout>
                      <Admin />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Reports />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/schedule-settings" 
                element={
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <MainLayout>
                      <ScheduleSettings />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TimesheetSettingsProvider>
        </WorkScheduleProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
