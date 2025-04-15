
import { TimeEntry, WorkSchedule, Organization, TeamMembership, AuditLog } from "@/types";
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper to create mock test entries with required fields
 */
export const createTestEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry => {
  return {
    id: overrides.id || `test-entry-${uuidv4()}`,
    userId: overrides.userId || 'test-user',
    date: overrides.date || new Date(),
    hours: overrides.hours !== undefined ? overrides.hours : 8,
    description: overrides.description || 'Test entry description',
    project: overrides.project || 'Test Project',
    ...overrides
  };
};

/**
 * Helper to create mock test entries without id
 */
export const createTestEntryInput = (overrides: Partial<Omit<TimeEntry, 'id'>> = {}): Omit<TimeEntry, 'id'> => {
  return {
    userId: overrides.userId || 'test-user',
    date: overrides.date || new Date(),
    hours: overrides.hours !== undefined ? overrides.hours : 8,
    description: overrides.description || 'Test entry description',
    project: overrides.project || 'Test Project',
    ...overrides
  };
};

/**
 * Helper to create a mock work schedule for tests
 */
export const createTestWorkSchedule = (overrides: Partial<WorkSchedule> = {}): WorkSchedule => {
  return {
    id: overrides.id || `test-schedule-${uuidv4()}`,
    userId: overrides.userId || 'test-user',
    name: overrides.name || 'Test Schedule',
    weeks: overrides.weeks || {
      1: {
        monday: { startTime: '09:00', endTime: '17:00' },
        tuesday: { startTime: '09:00', endTime: '17:00' },
        wednesday: { startTime: '09:00', endTime: '17:00' },
        thursday: { startTime: '09:00', endTime: '17:00' },
        friday: { startTime: '09:00', endTime: '17:00' }
      },
      2: {
        monday: { startTime: '09:00', endTime: '17:00' },
        tuesday: { startTime: '09:00', endTime: '17:00' },
        wednesday: { startTime: '09:00', endTime: '17:00' },
        thursday: { startTime: '09:00', endTime: '17:00' },
        friday: { startTime: '09:00', endTime: '17:00' }
      }
    },
    rdoDays: overrides.rdoDays || {
      1: [],
      2: []
    },
    ...overrides
  };
};

/**
 * Helper to create mock audit log entries
 */
export const createTestAuditLog = (overrides: Partial<AuditLog> = {}): AuditLog => {
  return {
    id: overrides.id || `audit-${uuidv4()}`,
    userId: overrides.userId || 'test-user',
    action: overrides.action || 'test-action',
    targetResource: overrides.targetResource || 'test-resource',
    details: overrides.details || 'test details',
    timestamp: overrides.timestamp || new Date(),
    ipAddress: overrides.ipAddress || '127.0.0.1',
    ...overrides
  };
};

/**
 * Creates a mock service implementation with pre-populated data
 * @param mockEntries Initial entries to populate the service with
 */
export const createMockTimeEntryService = (mockEntries: TimeEntry[] = []) => {
  // Create a storage object that mimics localStorage
  const mockStorage: Record<string, TimeEntry[]> = {
    'timeEntries': mockEntries,
  };
  
  return {
    storage: mockStorage,
    getAllEntries: jest.fn(() => mockStorage.timeEntries || []),
    getUserEntries: jest.fn((userId: string) => 
      (mockStorage.timeEntries || []).filter(entry => entry.userId === userId)
    ),
    getDayEntries: jest.fn((date: Date, userId: string) => 
      (mockStorage.timeEntries || []).filter(entry => 
        entry.userId === userId && 
        new Date(entry.date).toDateString() === date.toDateString()
      )
    ),
    createEntry: jest.fn((entry: Omit<TimeEntry, "id">) => {
      const newId = `test-entry-${uuidv4()}`;
      const newEntry = { ...entry, id: newId };
      mockStorage.timeEntries = [...(mockStorage.timeEntries || []), newEntry];
      return newId;
    }),
    updateEntry: jest.fn((entryId: string, updates: Partial<TimeEntry>) => {
      const entryIndex = (mockStorage.timeEntries || []).findIndex(e => e.id === entryId);
      if (entryIndex === -1) return false;
      
      mockStorage.timeEntries = [
        ...(mockStorage.timeEntries || []).slice(0, entryIndex),
        { ...(mockStorage.timeEntries || [])[entryIndex], ...updates },
        ...(mockStorage.timeEntries || []).slice(entryIndex + 1)
      ];
      return true;
    }),
    deleteEntry: jest.fn((entryId: string) => {
      const initialLength = (mockStorage.timeEntries || []).length;
      mockStorage.timeEntries = (mockStorage.timeEntries || []).filter(e => e.id !== entryId);
      return mockStorage.timeEntries.length !== initialLength;
    }),
    getMonthEntries: jest.fn((date: Date, userId: string) => 
      (mockStorage.timeEntries || []).filter(entry => 
        entry.userId === userId && 
        new Date(entry.date).getMonth() === date.getMonth() &&
        new Date(entry.date).getFullYear() === date.getFullYear()
      )
    ),
    calculateTotalHours: jest.fn((entries: TimeEntry[]) => 
      entries.reduce((sum, entry) => sum + entry.hours, 0)
    ),
    validateEntry: jest.fn(() => ({ valid: true })),
  };
};

