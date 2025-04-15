export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface TimeEntry {
  id: string;
  date: Date;
  hours: number;
  description: string;
  userId: string;
  startTime?: string;
  endTime?: string;
  jobNumber?: string;
  taskNumber?: string;
  rego?: string;
  project: string;
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

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNumber: string;
  date: Date;
  amount: number;
  status: 'draft' | 'sent' | 'paid';
}

export interface WorkSchedule {
  id: string;
  name: string;
  userId: string;
  weeks: {
    [weekNumber: number]: {
      monday?: { startTime: string; endTime: string };
      tuesday?: { startTime: string; endTime: string };
      wednesday?: { startTime: string; endTime: string };
      thursday?: { startTime: string; endTime: string };
      friday?: { startTime: string; endTime: string };
      saturday?: { startTime: string; endTime: string };
      sunday?: { startTime: string; endTime: string };
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
  deleteEntry: (entryId: string) => boolean;
  saveEntries: (entries: TimeEntry[]) => boolean;
  calculateTotalHours: (entries: TimeEntry[]) => number;
  validateEntry: (entry: Partial<TimeEntry>) => { valid: boolean; message?: string };
  autoCalculateHours: (startTime: string, endTime: string) => number;
  getMonthEntries: (date: Date, userId: string) => TimeEntry[];
}
