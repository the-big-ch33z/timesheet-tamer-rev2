
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();
  
  // Debug authentication state
  useEffect(() => {
    console.log("PublicRoute auth state:", { 
      isAuthenticated, 
      currentUser: currentUser ? currentUser.id : 'none' 
    });
  }, [isAuthenticated, currentUser]);
  
  // If user is logged in, redirect to timesheet
  if (isAuthenticated && currentUser) {
    console.log("User is authenticated, redirecting to timesheet");
    return <Navigate to="/timesheet" replace state={{ from: location.pathname }} />;
  }
  
  return <>{children}</>;
};

export default PublicRoute;
