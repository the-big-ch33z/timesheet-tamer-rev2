
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      // Not authenticated, redirect to login
      navigate('/login', { replace: true });
      return;
    }

    if (requiredRoles.length > 0 && currentUser) {
      // Check if user has required role
      const hasRequiredRole = requiredRoles.includes(currentUser.role);
      if (!hasRequiredRole) {
        // User doesn't have required role, redirect to timesheet
        navigate('/timesheet', { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, requiredRoles, navigate]);

  // If authenticated and has required role, render children
  if (isAuthenticated && (requiredRoles.length === 0 || 
      (currentUser && requiredRoles.includes(currentUser.role)))) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
};

export const getRoutesByRole = (role: UserRole): string[] => {
  const routes = ['/timesheet', '/reports', '/team-calendar'];
  
  if (role === 'admin') {
    return [...routes, '/manager', '/settings', '/admin'];
  }
  
  if (role === 'manager') {
    return [...routes, '/manager', '/settings'];
  }
  
  return routes; // team-member routes
};

export const canAccessRoute = (route: string, role: UserRole): boolean => {
  const allowedRoutes = getRoutesByRole(role);
  return allowedRoutes.includes(route);
};
