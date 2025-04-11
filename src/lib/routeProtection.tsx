
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log access attempts for audit purposes
    console.log(`Access attempt to ${location.pathname} by user:`, currentUser?.id);
    
    if (!isAuthenticated) {
      // Not authenticated, redirect to login
      toast({
        title: "Authentication Required",
        description: "Please log in to access this resource",
        variant: "destructive",
      });
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }

    if (requiredRoles.length > 0 && currentUser) {
      // Check if user has required role
      const hasRequiredRole = requiredRoles.includes(currentUser.role);
      
      if (!hasRequiredRole) {
        // User doesn't have required role, redirect to timesheet and show notification
        toast({
          title: "Access Denied",
          description: `You need ${requiredRoles.join(' or ')} permissions to access this page`,
          variant: "destructive",
        });
        // Log unauthorized access attempt
        console.log(`Unauthorized access attempt to ${location.pathname} by ${currentUser.id} with role ${currentUser.role}`);
        navigate('/timesheet', { replace: true });
        return;
      }
    }
    
    setIsAuthorized(true);
    setLoading(false);
  }, [isAuthenticated, currentUser, requiredRoles, navigate, location, toast]);

  // If authorized and finished loading, render children
  if (isAuthenticated && isAuthorized && !loading) {
    return <>{children}</>;
  }

  // Show loading state while checking authorization
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Return null as a fallback (should not reach this point due to redirects)
  return null;
};

export const RoleBasedComponent: React.FC<{
  children: React.ReactNode;
  requiredRoles: UserRole[];
  fallback?: React.ReactNode;
}> = ({ children, requiredRoles, fallback }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) return fallback || null;
  
  const hasRequiredRole = requiredRoles.includes(currentUser.role);
  
  if (hasRequiredRole) {
    return <>{children}</>;
  }
  
  return fallback || null;
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

export const canPerformAction = (
  action: string, 
  role: UserRole
): boolean => {
  // Define actions allowed for each role
  const rolePermissions: Record<UserRole, string[]> = {
    'admin': [
      'create_user', 'update_user', 'delete_user', 
      'create_team', 'update_team', 'delete_team',
      'create_project', 'update_project', 'delete_project',
      'update_system_settings', 'update_holidays',
      'view_all_timesheets', 'approve_timesheets',
      'run_all_reports'
    ],
    'manager': [
      'view_team_timesheets', 'approve_team_timesheets',
      'create_project', 'update_project',
      'run_team_reports', 'manage_team_members'
    ],
    'team-member': [
      'update_own_timesheet', 'view_own_reports',
      'update_profile'
    ]
  };

  return rolePermissions[role].includes(action);
};
