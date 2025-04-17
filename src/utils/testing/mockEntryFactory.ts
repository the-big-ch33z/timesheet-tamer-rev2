
import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Creates a mock time entry with all required fields
 */
export const createMockEntry = (
  overrides: Partial<TimeEntry> = {}
): TimeEntry => {
  return {
    id: uuidv4(),
    date: new Date(),
    hours: 8,
    description: "Test entry",
    userId: "test-user",
    project: "Default Project",
    ...overrides
  };
};

/**
 * Creates a mock time entry without ID (for create operations)
 */
export const createMockEntryInput = (
  overrides: Partial<Omit<TimeEntry, "id">> = {}
): Omit<TimeEntry, "id"> => {
  return {
    date: new Date(),
    hours: 8,
    description: "Test entry",
    userId: "test-user",
    project: "Default Project",
    ...overrides
  };
};

/**
 * Creates a mock work schedule for testing
 */
export const createMockWorkSchedule = (userId = "test-user") => {
  return {
    id: `test-schedule-${uuidv4()}`,
    name: "Test Schedule",
    userId: userId,
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
    }
  };
};
