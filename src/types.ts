
export interface TimeEntry {
  id: string;
  date: Date;
  project: string;
  hours: number;
  description: string;
  startTime?: string;
  endTime?: string;
}

export interface EntryFieldConfig {
  id: string;
  name: string;
  type: 'text' | 'select' | 'time' | 'number';
  required: boolean;
  options?: string[];
  icon?: string;
  visible: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD format
  region: string;
}

// Role-based access control interfaces
export type UserRole = 'admin' | 'manager' | 'team-member';

export type ActionType = 'create' | 'read' | 'update' | 'delete';
export type ResourceType = 'user' | 'team' | 'project' | 'timesheet' | 'report' | 'holiday' | 'setting';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  teamIds?: string[]; // For team members and managers
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface Organization {
  id: string;
  name: string;
  adminId: string; // The user ID of the admin who created this organization
  createdAt?: string;
  settings?: OrganizationSettings;
}

export interface OrganizationSettings {
  workingDays: string[]; // e.g., ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  workingHoursPerDay: number;
  timeFormat: '12h' | '24h';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  managerId: string; // The user ID of the manager for this team
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMembership {
  id: string;
  teamId: string;
  userId: string; // The team member's user ID
  managerId: string; // The ID of the manager who oversees this team member
  joinedAt?: string;
}

// Audit trail for security events
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string; // e.g., 'login', 'logout', 'create_user', 'update_role', etc.
  targetResource: string; // e.g., 'user/123', 'team/456', etc.
  details: string;
  ipAddress?: string;
}

// Data sync tracking
export interface SyncStatus {
  lastSyncedAt: string;
  entityType: string; // e.g., 'users', 'teams', 'timesheets', etc.
  status: 'success' | 'failed' | 'in_progress';
  recordsProcessed?: number;
}

// Permission matrix for role-based actions
export interface PermissionMatrix {
  [role: string]: {
    [resource: string]: {
      [action: string]: boolean;
    }
  }
}

// Team hierarchy representation
export interface TeamHierarchy {
  team: Team;
  manager: User;
  members: User[];
  subteams?: TeamHierarchy[];
}
