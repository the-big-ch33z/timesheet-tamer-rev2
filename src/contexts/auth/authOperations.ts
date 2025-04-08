
import { auditService } from '@/services/auditService';
import { syncService } from '@/services/syncService';
import { AuthStateType } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const createAuthOperations = (
  state: AuthStateType, 
  toast: ReturnType<typeof useToast>,
  navigate: ReturnType<typeof useNavigate>
) => {
  const login = async (email: string, password: string) => {
    try {
      const user = state.users.find(u => u.email === email);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      state.setCurrentUser(user);
      state.setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      await auditService.logEvent(
        user.id,
        'login',
        `user/${user.id}`,
        `User ${user.name} logged in`
      );
      
      toast.toast({
        title: "Logged in successfully",
        description: `Welcome back, ${user.name}`,
      });
      
      navigate('/timesheet');
    } catch (error) {
      toast.toast({
        title: "Login failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    if (state.currentUser) {
      auditService.logEvent(
        state.currentUser.id,
        'logout',
        `user/${state.currentUser.id}`,
        `User ${state.currentUser.name} logged out`
      );
    }
    
    state.setCurrentUser(null);
    state.setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    navigate('/login');
    
    toast.toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const register = async (email: string, name: string, password: string, organizationName: string) => {
    try {
      if (state.users.some(user => user.email === email)) {
        throw new Error("User with this email already exists");
      }
      
      const newOrgId = `org-${Date.now()}`;
      const newUserId = `user-${Date.now()}`;
      
      const newOrg = {
        id: newOrgId,
        name: organizationName,
        adminId: newUserId,
        createdAt: new Date().toISOString()
      };
      
      const newUser = {
        id: newUserId,
        email,
        name,
        role: 'admin' as const,
        organizationId: newOrgId,
        createdAt: new Date().toISOString(),
        status: 'active' as const
      };
      
      state.setUsers(prevUsers => [...prevUsers, newUser]);
      state.setOrganizations(prevOrgs => [...prevOrgs, newOrg]);
      state.setCurrentUser(newUser);
      state.setIsAuthenticated(true);
      
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      
      await auditService.logEvent(
        newUser.id,
        'register',
        `user/${newUser.id}`,
        `New user registered and organization ${organizationName} created`
      );
      
      await syncService.recordSync('users', 'success', 1);
      await syncService.recordSync('organizations', 'success', 1);
      
      toast.toast({
        title: "Registration successful",
        description: `Welcome to TimeFlow, ${name}!`,
      });
      
      navigate('/timesheet');
    } catch (error) {
      toast.toast({
        title: "Registration failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const syncData = async () => {
    try {
      if (!state.currentUser) {
        throw new Error("You must be logged in to sync data");
      }
      
      toast.toast({
        title: "Syncing data",
        description: "Starting data synchronization...",
      });
      
      await syncService.recordSync('users', 'in_progress', state.users.length);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await syncService.recordSync('users', 'success', state.users.length);
      
      await syncService.recordSync('teams', 'in_progress', state.teams.length);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await syncService.recordSync('teams', 'success', state.teams.length);
      
      await syncService.recordSync('teamMemberships', 'in_progress', state.teamMemberships.length);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      await syncService.recordSync('teamMemberships', 'success', state.teamMemberships.length);
      
      await auditService.logEvent(
        state.currentUser.id,
        'data_sync',
        'system/sync',
        `Synchronized ${state.users.length} users, ${state.teams.length} teams, and ${state.teamMemberships.length} memberships`
      );
      
      toast.toast({
        title: "Sync complete",
        description: `Successfully synchronized all data`,
      });
    } catch (error) {
      toast.toast({
        title: "Sync failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getAuditLogs = async () => {
    try {
      if (!state.currentUser) {
        throw new Error("You must be logged in to view audit logs");
      }
      
      if (state.currentUser.role !== 'admin') {
        throw new Error("Only admins can view audit logs");
      }
      
      return await auditService.getLogs();
    } catch (error) {
      toast.toast({
        title: "Failed to retrieve audit logs",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    login,
    logout,
    register,
    syncData,
    getAuditLogs
  };
};

export type AuthOperationsType = ReturnType<typeof createAuthOperations>;
