
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // If user is logged in, redirect to timesheet
  if (isAuthenticated) {
    return <Navigate to="/timesheet" replace state={{ from: location.pathname }} />;
  }
  
  return <>{children}</>;
};

export default PublicRoute;
