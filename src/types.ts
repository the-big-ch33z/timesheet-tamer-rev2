export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamIds?: string[];
  organizationId?: string;
  workScheduleId?: string;
  fte?: number;
  fortnightHours?: number;
  status?: 'active' | 'archived';
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'admin' | 'manager' | 'team-member';

export interface TimeEntry {
  id: string;
  date: Date;
  hours: number;
  description: string;
  userId: string;
  jobNumber?: string;
  taskNumber?: string;
  rego?: string;
  project: string;
  synthetic?: boolean; // Added synthetic property that was missing
  entryType?: string;  // Also adding entryType which appears in the code
}

export interface Client {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  phone: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  description: string;
  startDate: Date;
  endDate?: Date;
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
  description: string;
  estimatedHours: number;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  managerId: string;
  createdAt?: Date | string;
  description?: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNumber: string;
  date: Date;
  amount: number;
  status: 'draft' | 'sent' | 'paid';
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WorkDayBreaks {
  lunch?: boolean;  // 30-min unpaid break
  smoko?: boolean;  // 15-min paid break
}

export interface WorkSchedule {
  id: string;
  name: string;
  userId: string;
  isDefault?: boolean;
  weeks: {
    [weekNumber: number]: {
      [key in WeekDay]?: { 
        startTime: string; 
        endTime: string;
        breaks?: WorkDayBreaks;
      } | null;
    };
  };
  rdoDays: {
    [rdoNumber: number]: string[];
  };
}

export interface UserMetrics {
  id: string;
  userId: string;
  fte: number;
  fortnightHours: number;
}

export interface TimeEntryService {
  getAllEntries: () => TimeEntry[];
  getUserEntries: (userId: string) => TimeEntry[];
  getDayEntries: (date: Date, userId: string) => TimeEntry[];
  createEntry: (entry: Omit<TimeEntry, "id">) => string | null;
  updateEntry: (entryId: string, updates: Partial<TimeEntry>) => boolean;
  deleteEntry: (entryId: string) => Promise<boolean> | boolean;
  saveEntries: (entries: TimeEntry[]) => boolean;
  calculateTotalHours: (entries: TimeEntry[]) => number;
  validateEntry: (entry: Partial<TimeEntry>) => { valid: boolean; message?: string };
  autoCalculateHours: (startTime: string, endTime: string) => number;
  getMonthEntries: (date: Date, userId: string) => TimeEntry[];
}

export interface EntryFieldConfig {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  visible?: boolean;
  options?: string[];
  defaultValue?: string | number;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  size?: 'small' | 'medium' | 'large';
}

export interface Organization {
  id: string;
  name: string;
  createdAt?: Date | string;
  ownerId: string;
  adminId?: string;
}

export interface TeamMembership {
  id: string;
  userId: string;
  teamId: string;
  joinedAt: Date | string;
  role?: string;
  managerId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date | string;
  userId: string;
  action: string;
  targetResource: string;
  details: string;
  ipAddress?: string;
}

export interface SyncStatus {
  entityType: string;
  lastSyncedAt: Date | string;
  status: 'success' | 'failed' | 'in_progress';
  recordsProcessed?: number;
}
