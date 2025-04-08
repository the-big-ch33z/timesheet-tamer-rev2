
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth";
import { ProtectedRoute } from "@/lib/routeProtection";
import MainLayout from "./components/layout/MainLayout";
import Auth from "./pages/Auth";
import Timesheet from "./pages/Timesheet";
import Reports from "./pages/Reports";
import TeamCalendar from "./pages/TeamCalendar";
import Manager from "./pages/Manager";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "next-themes";

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't retry on failure by default
      refetchOnWindowFocus: false, // Don't refetch queries when window regains focus
    },
  },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/timesheet" replace />} />
            <Route path="/login" element={<Auth />} />
            
            {/* Protected Routes */}
            <Route path="/timesheet" element={<ProtectedRoute><MainLayout><Timesheet /></MainLayout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
            <Route path="/team-calendar" element={<ProtectedRoute><MainLayout><TeamCalendar /></MainLayout></ProtectedRoute>} />
            <Route path="/manager" element={<ProtectedRoute requiredRoles={['admin', 'manager']}><MainLayout><Manager /></MainLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRoles={['admin']}><MainLayout><Admin /></MainLayout></ProtectedRoute>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
