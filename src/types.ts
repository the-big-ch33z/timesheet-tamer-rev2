
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

// New interfaces for role-based access control
export type UserRole = 'admin' | 'manager' | 'team-member';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  teamIds?: string[]; // For team members and managers
}

export interface Organization {
  id: string;
  name: string;
  adminId: string; // The user ID of the admin who created this organization
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  managerId: string; // The user ID of the manager for this team
}

export interface TeamMembership {
  id: string;
  teamId: string;
  userId: string; // The team member's user ID
  managerId: string; // The ID of the manager who oversees this team member
}
