
import { User, UserRole, Team, Organization, TeamMembership, AuditLog } from '@/types';

export interface UserMetrics {
  fte: number;
  fortnightHours: number;
}

export interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  teams: Team[];
  organizations: Organization[];
  teamMemberships: TeamMembership[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  
  // Authentication operations
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  register: (user: Partial<User>) => Promise<User>;
  
  // User operations
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserWorkScheduleId: (userId: string, scheduleId: string) => Promise<void>;
  updateUserMetrics: (userId: string, metrics: UserMetrics) => Promise<void>;
  addUser: (email: string, name: string, role: UserRole) => Promise<User>;
  getUser: (userId: string) => User | null;
  getUserById: (userId: string) => User | undefined;
  getUsersByRole: (role: UserRole) => User[];
  getUsersByTeam: (teamId: string) => User[];
  archiveUser: (userId: string) => Promise<void>;
  restoreUser: (userId: string) => Promise<void>;
  permanentDeleteUser: (userId: string) => Promise<void>;
  
  // Team operations
  createTeam: (name: string, managerId: string) => Promise<Team>;
  getTeamById: (teamId: string) => Team | undefined;
  getTeamsByManager: (managerId: string) => Team[];
  assignManagerToTeam: (managerId: string, teamId: string) => Promise<void>;
  addTeamMember: (email: string, name: string, teamId: string) => Promise<User>;
  removeUserFromTeam: (userId: string, teamId: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  
  // Organization operations
  getOrganizationById: (orgId: string) => Organization | undefined;
  
  // Sync operations
  syncData: () => Promise<void>;
  
  // Audit operations
  getAuditLogs: () => Promise<AuditLog[]>;
}
