import React from 'react';
import { UserRole } from '@/types';
import { useAuth } from '@/contexts/auth';
import { Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RoleBasedButtonProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  action?: string;
  showMessage?: boolean;
}

export const RoleBasedButton: React.FC<RoleBasedButtonProps> = ({ 
  allowedRoles, 
  children,
  action,
  showMessage = false
}) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;
  
  const hasAccess = allowedRoles.includes(currentUser.role);
  
  if (!hasAccess && showMessage) {
    return (
      <Alert variant="destructive" className="mb-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to perform this action
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!hasAccess) return null;
  
  if (action) {
    console.log(`User ${currentUser.id} (${currentUser.role}) accessing action: ${action}`);
  }
  
  return <>{children}</>;
};

export const RoleBasedUI: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;
  
  if (allowedRoles.includes(currentUser.role)) {
    return <>{children}</>;
  }
  
  return null;
};

interface RoleBasedSectionProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleBasedSection: React.FC<RoleBasedSectionProps> = ({ 
  allowedRoles, 
  children,
  fallback
}) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;
  
  if (allowedRoles.includes(currentUser.role)) {
    return <>{children}</>;
  }
  
  return fallback ? <>{fallback}</> : null;
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const getBadgeColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'team-member':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor()}`}>
      <Shield className="w-3 h-3 mr-1" />
      {role.replace('-', ' ')}
    </span>
  );
};

export const withRoleAccess = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[]
) => {
  return (props: P) => {
    const { currentUser } = useAuth();
    
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return null;
    }
    
    return <Component {...props} />;
  };
};
