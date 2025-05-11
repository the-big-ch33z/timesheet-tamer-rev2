
/**
 * Tests for TOIL service functionality
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { TOILService, toilService } from '../toilService';
import { TOILRecord } from '@/types/toil';
import * as storage from '../storage';

// Mock the storage module
vi.mock('../storage', () => ({
  storeTOILRecord: vi.fn().mockResolvedValue(true),
  loadTOILRecords: vi.fn().mockReturnValue([]),
  getTOILSummary: vi.fn(),
  cleanupDuplicateTOILRecords: vi.fn().mockResolvedValue(true)
}));

// Mock uuid generation
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234'
}));

describe('TOILService', () => {
  let testService: TOILService;
  
  beforeEach(() => {
    testService = new TOILService(false);
    vi.resetAllMocks();
  });
  
  test('should create a new instance', () => {
    expect(testService).toBeInstanceOf(TOILService);
  });
  
  test('clearCache should clear TOIL summary caches', () => {
    // Mock localStorage
    const mockLocalStorage = {
      length: 3,
      key: vi.fn((index) => {
        const keys = [
          'toil:summary:user1:2023-05', 
          'toil:summary:user2:2023-06', 
          'otherKey'
        ];
        return keys[index];
      }),
      removeItem: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    testService.clearCache();
    
    expect(mockLocalStorage.key).toHaveBeenCalledTimes(3);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('toil:summary:user1:2023-05');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('toil:summary:user2:2023-06');
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('otherKey');
  });
  
  test('calculateAndStoreTOIL should handle empty entries', async () => {
    const result = await testService.calculateAndStoreTOIL(
      [],
      new Date('2023-05-01'),
      'user1',
      { weeks: [] },
      []
    );
    
    expect(result).toBeNull();
    expect(storage.storeTOILRecord).not.toHaveBeenCalled();
  });
  
  test('calculateAndStoreTOIL should handle synthetic TOIL entries', async () => {
    // Mock getTOILSummary to return a valid summary
    vi.mocked(storage.getTOILSummary).mockReturnValue({
      userId: 'user1',
      monthYear: '2023-05',
      accrued: 5,
      used: 2,
      remaining: 3
    });
    
    const result = await testService.calculateAndStoreTOIL(
      [{ id: '1', userId: 'user1', date: new Date('2023-05-01'), hours: 8, jobNumber: 'TOIL', synthetic: true }],
      new Date('2023-05-01'),
      'user1',
      { weeks: [] },
      []
    );
    
    expect(result).toEqual({
      userId: 'user1',
      monthYear: '2023-05',
      accrued: 5,
      used: 2,
      remaining: 3
    });
    expect(storage.storeTOILRecord).not.toHaveBeenCalled();
  });
  
  // Fix date type errors in the test cases below
  test('getTOILSummary should handle invalid numeric values', () => {
    vi.mocked(storage.getTOILSummary).mockReturnValue({
      userId: 'user1',
      monthYear: '2023-05',
      accrued: NaN,
      used: 2,
      remaining: 3
    });
    
    const result = testService.getTOILSummary('user1', '2023-05');
    
    expect(result).toEqual({
      userId: 'user1',
      monthYear: '2023-05',
      accrued: 0,
      used: 2,
      remaining: 3
    });
  });
  
  test('recordTOILUsage should validate input entry', async () => {
    // Valid date object for tests
    const testDate = new Date('2023-05-01');
    
    const invalidEntry = {
      id: '1',
      userId: 'user1',
      date: testDate, // Fixed: using Date object instead of string
      hours: -1,
      jobNumber: 'TOIL'
    };
    
    const result = await testService.recordTOILUsage(invalidEntry);
    
    expect(result).toBe(false);
  });
  
  test('recordTOILUsage should check jobNumber', async () => {
    // Valid date object for tests
    const testDate = new Date('2023-05-01');
    
    const nonToilEntry = {
      id: '1',
      userId: 'user1',
      date: testDate, // Fixed: using Date object instead of string
      hours: 8,
      jobNumber: 'OTHER'
    };
    
    const result = await testService.recordTOILUsage(nonToilEntry);
    
    expect(result).toBe(false);
  });
  
  test('recordTOILUsage should prevent duplicate entries', async () => {
    // Valid date object for tests
    const testDate = new Date('2023-05-01');
    
    vi.mocked(storage.loadTOILUsage).mockReturnValue([
      {
        id: 'existing-1',
        userId: 'user1',
        date: testDate, // Fixed: using Date object instead of string
        hours: 4,
        entryId: '1',
        monthYear: '2023-05'
      }
    ]);
    
    const result = await testService.recordTOILUsage({
      id: '1',
      userId: 'user1',
      date: testDate,
      hours: 4,
      jobNumber: 'TOIL'
    });
    
    expect(result).toBe(true);
    expect(storage.cleanupDuplicateTOILRecords).toHaveBeenCalledWith('user1');
  });
});
