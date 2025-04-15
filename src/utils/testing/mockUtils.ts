
import { TimeEntry, WorkSchedule } from "@/types";

/**
 * Helper to create mock test entries with required fields
 */
export const createTestEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry => {
  return {
    id: 'test-entry-' + Math.random().toString(36).substr(2, 9),
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
    id: 'test-schedule',
    name: 'Test Schedule',
    userId: 'test-user',
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
