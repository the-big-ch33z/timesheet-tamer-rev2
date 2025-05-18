import { auditService } from '@/services/auditService';
import { syncService } from '@/services/syncService';
import { AuthStateType } from '../AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Organization, User } from '@/types';

export const createAuthenticationOperations = (
  state: AuthStateType, 
  toast: ReturnType<typeof useToast>,
  navigate: ReturnType<typeof useNavigate>
) => {
  const login = async (email: string, password: string) => {
    try {
      const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        throw new Error("Invalid email or password. Please try again.");
      }
      
      // In a real application, we would verify the password here
      // For now, we're just checking if the user exists
      
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
        variant: "success"
      });
      
      navigate('/timesheet');
    } catch (error) {
      console.error("Login error:", error);
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
      
      const newOrg: Organization = {
        id: newOrgId,
        name: organizationName,
        ownerId: newUserId,
        createdAt: new Date().toISOString()
      };
      
      const newUser: User = {
        id: newUserId,
        email,
        name,
        role: 'admin' as const,
        organizationId: newOrgId,
        status: 'active' as const
      };
      
      state.setUsers(prevUsers => [...prevUsers, newUser]);
      state.setOrganizations(prevOrgs => [...prevOrgs, newOrg]);
      state.setCurrentUser(newUser);
      state.setIsAuthenticated(true);
      
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      localStorage.setItem('users', JSON.stringify([...state.users, newUser]));
      localStorage.setItem('organizations', JSON.stringify([...state.organizations, newOrg]));
      
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
        variant: "success"
      });
      
      navigate('/timesheet');
    } catch (error) {
      console.error("Registration error:", error);
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
