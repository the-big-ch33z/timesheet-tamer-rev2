
import { auditService } from '@/services/auditService';
import { syncService } from '@/services/syncService';
import { AuthStateType } from '../AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const createAuthenticationOperations = (
  state: AuthStateType, 
  toast: ReturnType<typeof useToast>,
  navigate: ReturnType<typeof useNavigate>
) => {
  const login = async (email: string, password: string) => {
    try {
      // For demo/testing purposes, allow any email to work if no users exist yet
      let user;
      
      if (state.users.length === 0) {
        console.log("No users found, creating a default admin user");
        // Create a default user and organization
        const newOrgId = `org-${Date.now()}`;
        const newUserId = `user-${Date.now()}`;
        
        const newOrg = {
          id: newOrgId,
          name: "Demo Organization",
          adminId: newUserId,
          createdAt: new Date().toISOString()
        };
        
        user = {
          id: newUserId,
          email,
          name: email.split('@')[0],
          role: 'admin' as const,
          organizationId: newOrgId,
          createdAt: new Date().toISOString(),
          status: 'active' as const
        };
        
        state.setUsers([user]);
        state.setOrganizations([newOrg]);
      } else {
        user = state.users.find(u => u.email === email);
        
        if (!user) {
          throw new Error("User not found");
        }
      }
      
      // Update authentication state
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
    navigate('/auth');
    
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

  return {
    login,
    logout,
    register
  };
};

export type AuthenticationOperationsType = ReturnType<typeof createAuthenticationOperations>;
