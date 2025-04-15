
import { renderHook, act } from '@testing-library/react';
import { useUnifiedTimeEntries } from '../useUnifiedTimeEntries';
import { unifiedTimeEntryService } from '@/utils/time/services/unifiedTimeEntryService';
import { createTestEntryInput } from '@/utils/testing/mockUtils';

// Mock the localStorage
const mockLocalStorage: { [key: string]: string } = {};

beforeAll(() => {
  global.Storage.prototype.getItem = jest.fn(
    (key: string) => mockLocalStorage[key]
  );
  global.Storage.prototype.setItem = jest.fn(
    (key: string, value: string) => {
      mockLocalStorage[key] = value;
    }
  );
});

// Mock the toast notifications
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('useUnifiedTimeEntries Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
  });

  it('initializes with empty entries', () => {
    const { result } = renderHook(() => useUnifiedTimeEntries({ userId: 'user1' }));
    expect(result.current.entries).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('creates a new entry', () => {
    const { result } = renderHook(() => useUnifiedTimeEntries({ userId: 'user1' }));

    const newEntry = createTestEntryInput({ userId: 'user1' });
    
    act(() => {
      const entryId = result.current.createEntry(newEntry);
      expect(typeof entryId).toBe('string');
      expect(entryId).toBeTruthy();
    });
  });

  it('updates an existing entry', () => {
    const { result } = renderHook(() => useUnifiedTimeEntries({ userId: 'user1' }));

    let entryId: string | null = null;
    
    act(() => {
      // First create an entry
      const newEntry = createTestEntryInput({ userId: 'user1' });
      entryId = result.current.createEntry(newEntry);
    });

    expect(entryId).toBeTruthy();

    if (entryId) {
      act(() => {
        const success = result.current.updateEntry(entryId, { hours: 4 });
        expect(success).toBe(true);
      });
    }
  });

  it('deletes an entry', () => {
    const { result } = renderHook(() => useUnifiedTimeEntries({ userId: 'user1' }));

    let entryId: string | null = null;
    
    act(() => {
      const newEntry = createTestEntryInput({ userId: 'user1' });
      entryId = result.current.createEntry(newEntry);
    });

    expect(entryId).toBeTruthy();

    if (entryId) {
      act(() => {
        const success = result.current.deleteEntry(entryId);
        expect(success).toBe(true);
      });
    }
  });

  it('filters entries by date', () => {
    const { result } = renderHook(() => useUnifiedTimeEntries({ 
      userId: 'user1',
      date: new Date('2025-04-15')
    }));

    act(() => {
      // Create entries for different dates
      result.current.createEntry(createTestEntryInput({ 
        userId: 'user1',
        date: new Date('2025-04-15')
      }));
      
      result.current.createEntry(createTestEntryInput({
        userId: 'user1',
        date: new Date('2025-04-16')
      }));
    });

    const dayEntries = result.current.getDayEntries(new Date('2025-04-15'), 'user1');
    expect(dayEntries.length).toBe(1);
  });

  it('handles storage sync between tabs', () => {
    const { result } = renderHook(() => useUnifiedTimeEntries({ userId: 'user1' }));

    act(() => {
      // Simulate storage event from another tab
      const event = new StorageEvent('storage', {
        key: 'timeEntries',
        newValue: JSON.stringify([{
          id: 'test-id',
          userId: 'user1',
          date: new Date().toISOString(),
          hours: 8
        }])
      });
      window.dispatchEvent(event);
    });

    // The hook should have reloaded its data
    expect(result.current.entries.length).toBe(1);
  });

  it('tracks deleted entries correctly', () => {
    const { result } = renderHook(() => useUnifiedTimeEntries({ userId: 'user1' }));

    let entryId: string | null = null;
    
    act(() => {
      const newEntry = createTestEntryInput({ userId: 'user1' });
      entryId = result.current.createEntry(newEntry);
    });

    if (entryId) {
      act(() => {
        // Delete the entry
        result.current.deleteEntry(entryId);
      });

      // Create a new entry with same data
      act(() => {
        const newEntry = createTestEntryInput({ userId: 'user1' });
        result.current.createEntry(newEntry);
      });

      // The deleted entry should not reappear
      const deletedEntry = result.current.entries.find(e => e.id === entryId);
      expect(deletedEntry).toBeUndefined();
    }
  });
});
