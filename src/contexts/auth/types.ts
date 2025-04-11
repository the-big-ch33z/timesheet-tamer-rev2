
import { User, Organization, Team, TeamMembership, UserRole } from '@/types';

// Define the login credentials type
export interface LoginCredentials {
  email: string;
  password: string;
}

// Define the signup credentials type
export interface SignupCredentials {
  email: string;
  name: string;
  password: string;
  organizationName: string;
}

// Define the user metrics type
export interface UserMetrics {
  fte?: number;
  fortnightHours?: number;
}

export interface AuthContextType {
  currentUser: User | null;
  users: User[];
  organizations: Organization[];
  teams: Team[];
  teamMemberships: TeamMembership[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, name: string, password: string, organizationName: string) => Promise<void>;
  createTeam: (name: string, managerId: string) => Promise<Team>;
  addUser: (email: string, name: string, role?: UserRole) => Promise<User>;
  addTeamMember: (email: string, name: string, teamId: string) => Promise<User>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  updateUserMetrics: (userId: string, metrics: UserMetrics) => Promise<void>;
  assignManagerToTeam: (managerId: string, teamId: string) => Promise<void>;
  getUsersByRole: (role: UserRole) => User[];
  getUsersByTeam: (teamId: string) => User[];
  getTeamsByManager: (managerId: string) => Team[];
  getOrganizationById: (orgId: string) => Organization | undefined;
  getTeamById: (teamId: string) => Team | undefined;
  getUserById: (userId: string) => User | undefined;
  removeUserFromTeam: (userId: string, teamId: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  archiveUser: (userId: string) => Promise<void>;
  restoreUser: (userId: string) => Promise<void>;
  permanentDeleteUser: (userId: string) => Promise<void>;
  syncData: () => Promise<void>;
  getAuditLogs: () => Promise<any[]>;
}
