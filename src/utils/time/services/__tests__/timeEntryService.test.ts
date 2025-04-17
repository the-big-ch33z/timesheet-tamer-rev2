
import { unifiedTimeEntryService } from '@/utils/time/services';
import { createTestEntry, createTestEntryInput } from '@/utils/testing/mockUtils';
import { TimeEntry } from '@/types';

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

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('Time Entry Service', () => {
  // Use unified service for all tests
  const service = unifiedTimeEntryService;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  beforeEach(() => {
    mockLocalStorage.clear();
    // Reset the service state by invalidating cache
    (service as any).invalidateCache();
  });
  
  describe('CRUD Operations', () => {
    it('creates and retrieves entries correctly', () => {
      const entryData = createTestEntryInput();
      const entryId = service.createEntry(entryData);
      
      expect(entryId).toBeTruthy();
      expect(typeof entryId).toBe('string');
      
      const allEntries = service.getAllEntries();
      expect(allEntries.length).toBe(1);
      expect(allEntries[0].id).toBe(entryId);
      expect(allEntries[0].userId).toBe('test-user');
      expect(allEntries[0].hours).toBe(8);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'timeEntries', 
        expect.any(String)
      );
    });
    
    it('updates entries correctly', () => {
      const entryId = service.createEntry(createTestEntryInput());
      
      const updateResult = service.updateEntry(entryId!, {
        hours: 4,
        description: 'Updated entry'
      });
      
      expect(updateResult).toBe(true);
      
      const entries = service.getAllEntries();
      const updatedEntry = entries.find(e => e.id === entryId);
      expect(updatedEntry?.hours).toBe(4);
      expect(updatedEntry?.description).toBe('Updated entry');
    });
    
    it('deletes entries correctly', () => {
      const entryId = service.createEntry(createTestEntryInput({
        userId: 'user123',
        date: today,
        hours: 8
      }));
      
      expect(service.getAllEntries().length).toBe(1);
      
      const deleteResult = service.deleteEntry(entryId!);
      
      expect(deleteResult).toBe(true);
      expect(service.getAllEntries().length).toBe(0);
    });
  });
  
  describe('Query Operations', () => {
    it('filters entries by user ID', () => {
      service.createEntry(createTestEntryInput({
        userId: 'user1',
        date: today,
        hours: 8
      }));
      
      service.createEntry(createTestEntryInput({
        userId: 'user2',
        date: today,
        hours: 4
      }));
      
      service.createEntry(createTestEntryInput({
        userId: 'user1',
        date: yesterday,
        hours: 6
      }));
      
      const user1Entries = service.getUserEntries('user1');
      expect(user1Entries.length).toBe(2);
      expect(user1Entries.every(e => e.userId === 'user1')).toBe(true);
      
      const user2Entries = service.getUserEntries('user2');
      expect(user2Entries.length).toBe(1);
      expect(user2Entries[0].userId).toBe('user2');
    });
    
    it('filters entries by date and user', () => {
      service.createEntry(createTestEntryInput({
        userId: 'user1',
        date: today,
        hours: 8
      }));
      
      service.createEntry(createTestEntryInput({
        userId: 'user1',
        date: yesterday,
        hours: 6
      }));
      
      const todayEntries = service.getDayEntries(today, 'user1');
      expect(todayEntries.length).toBe(1);
      expect(todayEntries[0].hours).toBe(8);
      
      const yesterdayEntries = service.getDayEntries(yesterday, 'user1');
      expect(yesterdayEntries.length).toBe(1);
      expect(yesterdayEntries[0].hours).toBe(6);
    });
  });
  
  describe('Calculation Operations', () => {
    it('calculates total hours correctly', () => {
      const entries: TimeEntry[] = [
        createTestEntry({ id: '1', userId: 'user1', date: today, hours: 3.5 }),
        createTestEntry({ id: '2', userId: 'user1', date: today, hours: 2.5 }),
        createTestEntry({ id: '3', userId: 'user1', date: today, hours: 1 })
      ];
      
      const total = service.calculateTotalHours(entries);
      expect(total).toBe(7);
    });
    
    it('handles empty entries when calculating hours', () => {
      expect(service.calculateTotalHours([])).toBe(0);
    });
    
    it('auto-calculates hours from times correctly', () => {
      const hours = service.autoCalculateHours('09:00', '17:00');
      expect(hours).toBe(8);
    });
  });
  
  describe('Validation', () => {
    it('validates entries correctly', () => {
      const validEntry = createTestEntryInput({
        userId: 'user1',
        date: new Date(),
        hours: 8
      });
      expect(service.validateEntry(validEntry).valid).toBe(true);
      
      const noUserEntry = {
        date: new Date(),
        hours: 8,
        description: 'Test entry',
        project: 'Test Project'
      };
      expect(service.validateEntry(noUserEntry).valid).toBe(false);
      
      const noDateEntry = {
        userId: 'user1',
        hours: 8,
        description: 'Test entry',
        project: 'Test Project'
      };
      expect(service.validateEntry(noDateEntry).valid).toBe(false);
      
      const negativeHoursEntry = createTestEntryInput({
        userId: 'user1',
        date: new Date(),
        hours: -2
      });
      expect(service.validateEntry(negativeHoursEntry).valid).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('handles localStorage failures gracefully', () => {
      jest.spyOn(mockLocalStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage full');
      });
      
      const result = service.createEntry(createTestEntryInput({
        userId: 'user1',
        date: today,
        hours: 8
      }));
      
      expect(result).toBe(null);
    });
    
    it('handles malformed entries in storage', () => {
      mockLocalStorage.setItem('timeEntries', 'not valid json');
      
      const entries = service.getAllEntries();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });
  });
});
