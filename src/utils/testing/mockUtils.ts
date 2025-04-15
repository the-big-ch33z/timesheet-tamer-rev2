
import { TimeEntry, WorkSchedule, Organization, TeamMembership, AuditLog } from "@/types";
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper to create mock test entries with required fields
 */
export const createTestEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry => {
  return {
    id: overrides.id || `test-entry-${uuidv4()}`,
    userId: 'test-user',
    date: new Date(),
    hours: 8,
    description: 'Test entry description',
    project: 'Test Project',
    ...overrides
  };
};

/**
 * Helper to create mock test entries without id
 */
export const createTestEntryInput = (overrides: Partial<Omit<TimeEntry, 'id'>> = {}): Omit<TimeEntry, 'id'> => {
  return {
    userId: 'test-user',
    date: new Date(),
    hours: 8,
    description: 'Test entry description',
    project: 'Test Project',
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
    name: 'Test Schedule',
    weeks: {
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
    rdoDays: {
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
    userId: 'test-user',
    action: 'test-action',
    targetResource: 'test-resource',
    details: 'test details',
    timestamp: new Date(),
    ...overrides
  };
};

