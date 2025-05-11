
import { toilService } from '../toilService';
import { 
  clearAllTOILCaches, 
  clearTOILStorageForMonth,
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY
} from '../storage';
import { TOILRecord, TOILUsage } from '@/types/toil';
import { TimeEntry } from '@/types';
import { createTestEntry } from '@/utils/testing/mockUtils';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    })
  };
})();

// Mock date functions
const mockDateFns = {
  format: jest.fn((date: Date, format: string) => '2025-05'),
  isSameDay: jest.fn((date1: Date, date2: Date) => 
    date1.toDateString() === date2.toDateString()
  ),
  isWeekend: jest.fn((date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  })
};

// Mock workday functions
jest.mock('../../../scheduleUtils', () => ({
  isWorkingDay: jest.fn(() => true),
  calculateDayHours: jest.fn(() => 8),
  isNonWorkingDay: jest.fn(() => false),
  isHolidayDate: jest.fn(() => false)
}));

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
jest.mock('date-fns', () => mockDateFns);

describe('TOIL Service', () => {
  const userId = 'test-user';
  const testDate = new Date('2025-05-10');
  
  beforeEach(() => {
    mockLocalStorage.clear();
    clearAllTOILCaches();
    jest.clearAllMocks();
  });
  
  describe('TOIL Record Management', () => {
    it('should calculate and store TOIL for overtime entries', async () => {
      // Create a test entry with overtime
      const entries: TimeEntry[] = [
        createTestEntry({
          id: 'entry-1',
          userId,
          date: testDate,
          hours: 10, // 2 hours overtime
          description: 'Overtime work'
        })
      ];
      
      // Create a mock work schedule
      const mockSchedule = {
        userId,
        defaultHours: 8,
        schedule: [
          { dayOfWeek: 1, hours: 8 },
          { dayOfWeek: 2, hours: 8 },
          { dayOfWeek: 3, hours: 8 },
          { dayOfWeek: 4, hours: 8 },
          { dayOfWeek: 5, hours: 8 }
        ]
      };
      
      // Calculate TOIL
      const result = await toilService.calculateAndStoreTOIL(
        entries,
        testDate,
        userId,
        mockSchedule,
        []
      );
      
      // Verify the result
      expect(result).toBeTruthy();
      expect(result.accrued).toBe(2); // 2 hours of TOIL accrued
      
      // Verify localStorage was called to store the record
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        TOIL_RECORDS_KEY,
        expect.any(String)
      );
    });
    
    it('should handle no TOIL when hours match schedule', async () => {
      // Create a test entry with exact scheduled hours
      const entries: TimeEntry[] = [
        createTestEntry({
          id: 'entry-1',
          userId,
          date: testDate,
          hours: 8, // Exactly scheduled hours
          description: 'Regular work'
        })
      ];
      
      // Create a mock work schedule
      const mockSchedule = {
        userId,
        defaultHours: 8,
        schedule: [
          { dayOfWeek: 1, hours: 8 },
          { dayOfWeek: 2, hours: 8 },
          { dayOfWeek: 3, hours: 8 },
          { dayOfWeek: 4, hours: 8 },
          { dayOfWeek: 5, hours: 8 }
        ]
      };
      
      // Calculate TOIL
      const result = await toilService.calculateAndStoreTOIL(
        entries,
        testDate,
        userId,
        mockSchedule,
        []
      );
      
      // Verify the result
      expect(result).toBeTruthy();
      expect(result.accrued).toBe(0); // No TOIL accrued
      
      // Verify localStorage was not called to store a record
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
        TOIL_RECORDS_KEY,
        expect.any(String)
      );
    });
    
    it('should clear TOIL for a month', async () => {
      // Setup: Add some mock TOIL data
      const mockRecords: TOILRecord[] = [
        { 
          id: 'toil-1', 
          userId, 
          date: testDate.toISOString(), 
          hours: 2, 
          entryId: 'entry-1' 
        }
      ];
      
      mockLocalStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(mockRecords));
      
      // Clear TOIL for the month
      await clearTOILStorageForMonth(userId, '2025-05');
      
      // Verify localStorage was called to update records
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        TOIL_RECORDS_KEY,
        '[]'
      );
    });
  });
  
  describe('TOIL Queries', () => {
    it('should get TOIL summary', async () => {
      // Setup: Add some mock TOIL data
      const mockRecords: TOILRecord[] = [
        { 
          id: 'toil-1', 
          userId, 
          date: testDate.toISOString(), 
          hours: 2, 
          entryId: 'entry-1' 
        },
        { 
          id: 'toil-2', 
          userId, 
          date: new Date('2025-05-11').toISOString(), 
          hours: 3, 
          entryId: 'entry-2' 
        }
      ];
      
      const mockUsage: TOILUsage[] = [
        {
          id: 'usage-1',
          userId,
          date: new Date('2025-05-15').toISOString(),
          hours: 1,
          entryId: 'leave-1'
        }
      ];
      
      mockLocalStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(mockRecords));
      mockLocalStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(mockUsage));
      
      // Get the summary
      const summary = await toilService.getMonthSummary(userId, '2025-05');
      
      // Verify the summary
      expect(summary).toBeTruthy();
      expect(summary.accrued).toBe(5); // 2 + 3 hours accrued
      expect(summary.used).toBe(1); // 1 hour used
      expect(summary.remaining).toBe(4); // 5 - 1 = 4 hours remaining
    });
  });
});
