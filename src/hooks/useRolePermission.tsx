
import { useAuth } from '@/contexts/auth';
import { canPerformAction, canAccessRoute } from '@/lib/routeProtection';

export function useRolePermission() {
  const { currentUser, isAuthenticated } = useAuth();
  
  const hasPermission = (action: string): boolean => {
    if (!isAuthenticated || !currentUser) return false;
    return canPerformAction(action, currentUser.role);
  };
  
  const canAccess = (route: string): boolean => {
    if (!isAuthenticated || !currentUser) return false;
    return canAccessRoute(route, currentUser.role);
  };
  
  const isAdmin = (): boolean => {
    return currentUser?.role === 'admin';
  };
  
  const isManager = (): boolean => {
    return currentUser?.role === 'manager' || currentUser?.role === 'admin';
  };
  
  // Add this isAdminOrManager helper method that was missing
  const isAdminOrManager = (): boolean => {
    return isAdmin() || isManager();
  };
  
  const isTeamMember = (): boolean => {
    return !!currentUser; // Any authenticated user is at least a team member
  };
  
  // Log permission check for audit purposes
  const checkAndLogPermission = (action: string): boolean => {
    const hasAccess = hasPermission(action);
    console.log(
      `Permission check: ${action} for user ${currentUser?.id || 'unauthenticated'} (${currentUser?.role || 'no role'}): ${hasAccess ? 'Granted' : 'Denied'}`
    );
    return hasAccess;
  };
  
  return {
    hasPermission,
    canAccess,
    isAdmin,
    isManager,
    isTeamMember,
    isAdminOrManager,
    checkAndLogPermission
  };
}
