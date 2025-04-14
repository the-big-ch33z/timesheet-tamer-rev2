
import { createTimeEntryService, STORAGE_KEY } from '../timeEntryService';
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
  // Create a fresh service instance for each test
  let service: ReturnType<typeof createTimeEntryService>;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  beforeEach(() => {
    mockLocalStorage.clear();
    service = createTimeEntryService();
  });
  
  describe('CRUD Operations', () => {
    it('creates and retrieves entries correctly', () => {
      // Create a test entry
      const entryData = {
        userId: 'user123',
        date: today,
        hours: 8,
        description: 'Test entry'
      };
      
      const entryId = service.createEntry(entryData);
      
      // Verify entry was created successfully
      expect(entryId).toBeTruthy();
      expect(typeof entryId).toBe('string');
      
      // Retrieve and check
      const allEntries = service.getAllEntries();
      expect(allEntries.length).toBe(1);
      expect(allEntries[0].id).toBe(entryId);
      expect(allEntries[0].userId).toBe('user123');
      expect(allEntries[0].hours).toBe(8);
      
      // Check if localStorage was updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY, 
        expect.any(String)
      );
    });
    
    it('updates entries correctly', () => {
      // Create then update
      const entryId = service.createEntry({
        userId: 'user123',
        date: today,
        hours: 8
      });
      
      const updateResult = service.updateEntry(entryId!, {
        hours: 4,
        description: 'Updated entry'
      });
      
      // Verify update was successful
      expect(updateResult).toBe(true);
      
      // Check updated entry
      const entries = service.getAllEntries();
      const updatedEntry = entries.find(e => e.id === entryId);
      expect(updatedEntry?.hours).toBe(4);
      expect(updatedEntry?.description).toBe('Updated entry');
    });
    
    it('deletes entries correctly', () => {
      // Create then delete
      const entryId = service.createEntry({
        userId: 'user123',
        date: today,
        hours: 8
      });
      
      // Verify entry exists
      expect(service.getAllEntries().length).toBe(1);
      
      const deleteResult = service.deleteEntry(entryId!);
      
      // Verify deletion was successful
      expect(deleteResult).toBe(true);
      expect(service.getAllEntries().length).toBe(0);
    });
  });
  
  describe('Query Operations', () => {
    it('filters entries by user ID', () => {
      // Create entries for different users
      service.createEntry({
        userId: 'user1',
        date: today,
        hours: 8
      });
      
      service.createEntry({
        userId: 'user2',
        date: today,
        hours: 4
      });
      
      service.createEntry({
        userId: 'user1',
        date: yesterday,
        hours: 6
      });
      
      // Get entries for user1
      const user1Entries = service.getUserEntries('user1');
      expect(user1Entries.length).toBe(2);
      expect(user1Entries.every(e => e.userId === 'user1')).toBe(true);
      
      // Get entries for user2
      const user2Entries = service.getUserEntries('user2');
      expect(user2Entries.length).toBe(1);
      expect(user2Entries[0].userId).toBe('user2');
    });
    
    it('filters entries by date and user', () => {
      // Create entries on different dates
      service.createEntry({
        userId: 'user1',
        date: today,
        hours: 8
      });
      
      service.createEntry({
        userId: 'user1',
        date: yesterday,
        hours: 6
      });
      
      // Get entries for user1 on today
      const todayEntries = service.getDayEntries(today, 'user1');
      expect(todayEntries.length).toBe(1);
      expect(todayEntries[0].hours).toBe(8);
      
      // Get entries for user1 on yesterday
      const yesterdayEntries = service.getDayEntries(yesterday, 'user1');
      expect(yesterdayEntries.length).toBe(1);
      expect(yesterdayEntries[0].hours).toBe(6);
    });
  });
  
  describe('Calculation Operations', () => {
    it('calculates total hours correctly', () => {
      const entries: TimeEntry[] = [
        { id: '1', userId: 'user1', date: today, hours: 3.5 },
        { id: '2', userId: 'user1', date: today, hours: 2.5 },
        { id: '3', userId: 'user1', date: today, hours: 1 }
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
      // Valid entry
      const validEntry = {
        userId: 'user1',
        date: new Date(),
        hours: 8
      };
      expect(service.validateEntry(validEntry).valid).toBe(true);
      
      // Invalid - missing userId
      const noUserEntry = {
        date: new Date(),
        hours: 8
      };
      expect(service.validateEntry(noUserEntry).valid).toBe(false);
      
      // Invalid - missing date
      const noDateEntry = {
        userId: 'user1',
        hours: 8
      };
      expect(service.validateEntry(noDateEntry).valid).toBe(false);
      
      // Invalid - negative hours
      const negativeHoursEntry = {
        userId: 'user1',
        date: new Date(),
        hours: -2
      };
      expect(service.validateEntry(negativeHoursEntry).valid).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('handles localStorage failures gracefully', () => {
      // Mock localStorage throwing an error
      jest.spyOn(mockLocalStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage full');
      });
      
      const result = service.createEntry({
        userId: 'user1',
        date: today,
        hours: 8
      });
      
      expect(result).toBe(null); // Should return null on error
    });
    
    it('handles malformed entries in storage', () => {
      // Set up invalid JSON in localStorage
      mockLocalStorage.setItem(STORAGE_KEY, 'not valid json');
      
      // Should recover gracefully
      const entries = service.getAllEntries();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });
  });
});
