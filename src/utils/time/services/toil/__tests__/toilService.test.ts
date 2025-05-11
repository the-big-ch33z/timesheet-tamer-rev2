
import { TimeEntry } from "@/types";
import { TOILService, TOILBalanceEntry, TOILUsageEntry, TOIL_JOB_NUMBER } from '../service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create a mock WorkSchedule type that matches what the test needs
interface WorkSchedule {
  id: string;
  name: string;
  userId: string;
  weeks: Record<1 | 2, Record<string, any>>;
  rdoDays: Record<1 | 2, string[]>;
}

// Mock implementation for testing
describe('TOILService', () => {
  let toilService: TOILService;
  
  // Mock localStorage
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    });
    
    // Initialize the service
    toilService = new TOILService();
    vi.spyOn(toilService, 'calculateBalance');
  });
  
  describe('initializing', () => {
    it('should initialize properly', () => {
      expect(toilService).toBeDefined();
      expect(typeof toilService.calculateBalance).toBe('function');
    });
  });
  
  describe('Calculating TOIL from overtime', () => {
    it('should calculate overtime hours correctly', async () => {
      const originalFn = toilService.calculateBalance;
      vi.spyOn(toilService, 'calculateBalance').mockImplementation(async (userId: string, date: Date) => {
        return {
          balance: 10,
          accrued: 15,
          used: 5,
          lastUpdated: new Date()
        };
      });
      
      // Get schedule for user
      const mockSchedule = {
        id: 'test-schedule',
        name: 'Test Schedule',
        userId: 'test-user',
        weeks: [{}, {}],  // Simplified for test
        rdoDays: [[], []] // Simplified for test
      } as unknown as WorkSchedule;
      
      // Check if it calculates correctly
      const result = await toilService.calculateOvertimeHours('test-user', new Date(), 9, mockSchedule);
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      
      // Restore original function
      vi.spyOn(toilService, 'calculateBalance').mockImplementation(originalFn);
    });
    
    it('should handle missing schedule gracefully', async () => {
      const result = await toilService.calculateOvertimeHours('test-user', new Date(), 9, null as any);
      expect(result).toBe(0); // Expect 0 when no schedule is provided
    });
  });
  
  describe('TOIL balance management', () => {
    it('should get balance for a user', async () => {
      const mockTOILData = JSON.stringify({
        'user123': {
          balance: 5,
          accrued: 10,
          used: 5,
          lastUpdated: new Date().toISOString()
        }
      });
      
      vi.spyOn(localStorage, 'getItem').mockReturnValue(mockTOILData);
      
      const balance = await toilService.getBalance('user123');
      expect(balance).toBeDefined();
      expect(balance.balance).toBe(5);
    });
    
    it('should handle adding TOIL accrual', async () => {
      // Create a mock entry that is compatible with TimeEntry interface
      const mockEntry = {
        id: 'entry1',
        userId: 'user123',
        date: new Date(),
        hours: 2,
        jobNumber: TOIL_JOB_NUMBER,
        description: 'Test TOIL entry',
        project: 'TOIL'
      } as TimeEntry;
      
      await toilService.addAccrualEntry(mockEntry);
      
      // Should have attempted to update localStorage
      expect(localStorage.setItem).toHaveBeenCalled();
    });
    
    it('should track TOIL balance over time', async () => {
      const balance1 = await toilService.calculateBalance('user123', new Date('2023-01-01'));
      expect(balance1.balance).toBeDefined();
      
      const mockEntry = {
        id: 'entry2',
        userId: 'user123',
        date: new Date('2023-01-02'),
        hours: 3,
        jobNumber: TOIL_JOB_NUMBER,
        description: 'Test TOIL accrual',
        project: 'TOIL'
      } as TimeEntry;
      
      await toilService.addAccrualEntry(mockEntry);
      
      const balance2 = await toilService.calculateBalance('user123', new Date('2023-01-03'));
      expect(balance2.balance).toBeGreaterThanOrEqual(balance1.balance);
    });
    
    it('should process TOIL usage', async () => {
      vi.spyOn(toilService, 'getBalance').mockResolvedValue({
        balance: 10,
        accrued: 15, 
        used: 5,
        lastUpdated: new Date()
      });
      
      const mockEntry = {
        id: 'entry3',
        userId: 'user123',
        date: new Date(),
        hours: 4,
        jobNumber: TOIL_JOB_NUMBER,
        description: 'Using TOIL',
        project: 'TOIL'
      } as TimeEntry;
      
      const result = await toilService.processUsage(mockEntry);
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });
});
