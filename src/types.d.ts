
// User related types
export type UserRole = 'admin' | 'manager' | 'team-member';
export type UserStatus = 'active' | 'archived' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  workScheduleId?: string;
  teamIds?: string[];
  organizationId?: string;
  avatar?: string | null;
  department?: string | null;
  position?: string | null;
  avatarUrl?: string;
}

// Team related types
export interface Team {
  id: string;
  name: string;
  managerId: string;
  organizationId: string;
  createdAt?: string;
}

export interface TeamMembership {
  id: string;
  userId: string;
  teamId: string;
  createdAt: string;
}

// Organization related types
export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string; // Added required property
}

// Audit log related types
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  targetResource: string;
  details: string;
}

// Sync status related types
export interface SyncStatus {
  id: string;
  entityType: string;
  lastSyncedAt: string;
  status: 'success' | 'failed' | 'in_progress';
  recordsProcessed?: number;
  errorMessage?: string;
}

// User metrics related types
export interface UserMetrics {
  fte: number;
  fortnightHours: number;
}
