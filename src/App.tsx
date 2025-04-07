
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Auth from "./pages/Auth";
import Timesheet from "./pages/Timesheet";
import Reports from "./pages/Reports";
import TeamCalendar from "./pages/TeamCalendar";
import Manager from "./pages/Manager";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

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
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/timesheet" replace />} />
        <Route path="/login" element={<Auth />} />
        
        {/* Protected Routes */}
        <Route path="/timesheet" element={<MainLayout><Timesheet /></MainLayout>} />
        <Route path="/reports" element={<MainLayout><Reports /></MainLayout>} />
        <Route path="/team-calendar" element={<MainLayout><TeamCalendar /></MainLayout>} />
        <Route path="/manager" element={<MainLayout><Manager /></MainLayout>} />
        <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
        <Route path="/admin" element={<MainLayout><Admin /></MainLayout>} />
        
        {/* No longer needed with the root redirect above */}
        {/* <Route path="/timesheet/" element={<Navigate to="/timesheet" replace />} /> */}
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
