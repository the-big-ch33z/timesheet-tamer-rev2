
import React, { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from './useAuthState';
import { createUserOperations } from './operations';
import { createTeamOperations } from './operations/team';
import { createOrganizationOperations } from './organizationOperations';
import { createAuthOperations } from './operations/authOperations';
import { AuthContextType } from './types';

// Enhanced logging for AuthProvider
const timestamp = () => new Date().toISOString();
const log = (message: string, data?: any) => {
  console.log(`[${timestamp()}] AUTH_PROVIDER: ${message}`, data || '');
};

// Create a default context
const defaultAuthContext: AuthContextType = {
  currentUser: null,
  users: [],
  organizations: [],
  teams: [],
  teamMemberships: [],
  isAuthenticated: false,
  setTeams: () => {},
  login: async () => {},
  logout: () => {},
  register: async () => {},
  createTeam: async () => ({ id: '', name: '', organizationId: '', managerId: '' }),
  addUser: async () => ({ id: '', email: '', name: '', role: 'team-member', organizationId: '' }),
  addTeamMember: async () => ({ id: '', email: '', name: '', role: 'team-member', organizationId: '' }),
  updateUserRole: async () => {},
  updateUserMetrics: async () => {},
  assignManagerToTeam: async () => {},
  getUsersByRole: () => [],
  getUsersByTeam: () => [],
  getTeamsByManager: () => [],
  getOrganizationById: () => undefined,
  getTeamById: () => undefined,
  getUserById: () => undefined,
  removeUserFromTeam: async () => {},
  deleteTeam: async () => {},
  archiveUser: async () => {},
  restoreUser: async () => {},
  permanentDeleteUser: async () => {},
  syncData: async () => {},
  getAuditLogs: async () => [],
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

export type AuthStateType = ReturnType<typeof useAuthState>;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  log("===== AUTH_PROVIDER INITIALIZATION =====");
  
  try {
    log("Initializing AuthProvider dependencies...");
    
    // Initialize state
    const state = useAuthState();
    log("✅ Auth state initialized");
    
    const navigate = useNavigate();
    log("✅ Navigate hook initialized");
    
    const toast = useToast();
    log("✅ Toast hook initialized");

    // Create operations
    log("Creating auth operations...");
    const userOperations = createUserOperations(state, toast);
    log("✅ User operations created");
    
    const teamOperations = createTeamOperations(state, toast);
    log("✅ Team operations created");
    
    const orgOperations = createOrganizationOperations(state);
    log("✅ Organization operations created");
    
    const authOperations = createAuthOperations(state, toast, navigate);
    log("✅ Auth operations created");

    // Combine all operations into context value
    const value: AuthContextType = {
      currentUser: state.currentUser,
      users: state.users,
      organizations: state.organizations,
      teams: state.teams,
      teamMemberships: state.teamMemberships,
      setTeams: state.setTeams,
      isAuthenticated: state.isAuthenticated,
      ...authOperations,
      ...userOperations,
      ...teamOperations,
      ...orgOperations
    };
    
    log("✅ Auth context value assembled");
    log("Rendering AuthProvider with context");

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {
    console.error(`[${timestamp()}] AUTH_PROVIDER: ❌ Error during AuthProvider initialization:`, error);
    console.error(`[${timestamp()}] AUTH_PROVIDER: Error details:`, error instanceof Error ? error.message : String(error));
    
    // Fallback render with default context
    return (
      <AuthContext.Provider value={defaultAuthContext}>
        <div className="p-4 bg-yellow-50 border border-yellow-200 mb-4">
          <h3 className="text-yellow-800 font-medium">Auth Initialization Warning</h3>
          <p className="text-yellow-700">Authentication system encountered an error during initialization.</p>
        </div>
        {children}
      </AuthContext.Provider>
    );
  }
};
