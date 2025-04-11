export interface TimeEntry {
  id: string;
  date: Date;
  hours: number;
  description?: string;
  jobNumber?: string;
  rego?: string;
  taskNumber?: string; // Added task number field
  startTime?: string;
  endTime?: string;
  project?: string;
  userId: string;
}

export interface EntryFieldConfig {
  id: string;
  name: string;
  type: 'text' | 'select' | 'time' | 'number' | 'textarea';
  required: boolean;
  options?: string[];
  icon?: string;
  visible: boolean;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD format
  region: string;
}

export type UserRole = 'admin' | 'manager' | 'team-member';

export type ActionType = 'create' | 'read' | 'update' | 'delete';
export type ResourceType = 'user' | 'team' | 'project' | 'timesheet' | 'report' | 'holiday' | 'setting';

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type WeekNumber = 1 | 2;

export interface WorkHours {
  startTime: string; // Format: "HH:MM" in 24h format
  endTime: string; // Format: "HH:MM" in 24h format
}

export interface WorkSchedule {
  id: string;
  name: string;
  weeks: {
    1: Record<WeekDay, WorkHours | null>; // Week 1
    2: Record<WeekDay, WorkHours | null>; // Week 2
  };
  rdoDays: {
    1: WeekDay[]; // Week 1 RDOs
    2: WeekDay[]; // Week 2 RDOs
  };
  isDefault?: boolean;
}

export interface LegacyWorkSchedule {
  id: string;
  name: string;
  workDays: Record<WeekDay, WorkHours | null>; // null means day off
  rdoDays: WeekDay[]; // Rostered Day Off
  isDefault?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  teamIds?: string[]; // For team members and managers
  workScheduleId?: string; // Reference to a work schedule
  useDefaultSchedule?: boolean; // If true, use the organization's default schedule
  fte?: number; // Full-Time Equivalent (1.0 = full-time, 0.5 = half-time)
  fortnightHours?: number; // Required hours per fortnight
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  status?: 'active' | 'inactive' | 'pending' | 'archived';
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

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string; // e.g., 'login', 'logout', 'create_user', 'update_role', etc.
  targetResource: string; // e.g., 'user/123', 'team/456', etc.
  details: string;
  ipAddress?: string;
}

export interface SyncStatus {
  lastSyncedAt: string;
  entityType: string; // e.g., 'users', 'teams', 'timesheets', etc.
  status: 'success' | 'failed' | 'in_progress';
  recordsProcessed?: number;
}

export interface PermissionMatrix {
  [role: string]: {
    [resource: string]: {
      [action: string]: boolean;
    }
  }
}

export interface TeamHierarchy {
  team: Team;
  manager: User;
  members: User[];
  subteams?: TeamHierarchy[];
}
