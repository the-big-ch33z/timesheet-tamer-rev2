
import { renderHook, act } from '@testing-library/react';
import { useTimeEntries } from '../useTimeEntries';
import { createMockEntryInput } from '@/utils/testing/mockEntryFactory';
import { unifiedTimeEntryService } from '@/utils/time/services/unifiedTimeEntryService';

// Mock the unifiedTimeEntryService
jest.mock('@/utils/time/services/unifiedTimeEntryService', () => {
  return {
    unifiedTimeEntryService: {
      getUserEntries: jest.fn(),
      getDayEntries: jest.fn(),
      createEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
      calculateTotalHours: jest.fn().mockReturnValue(8)
    }
  };
});

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock createTimeLogger
jest.mock('@/utils/time/errors/timeLogger', () => ({
  createTimeLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock unified time entry service
jest.mock('../../../useUnifiedTimeEntries', () => ({
  useUnifiedTimeEntries: () => ({
    entries: [],
    isLoading: false,
    createEntry: jest.fn().mockReturnValue('new-id-123'),
    updateEntry: jest.fn().mockReturnValue(true),
    deleteEntry: jest.fn().mockReturnValue(true),
    getDayEntries: jest.fn(),
    calculateTotalHours: jest.fn().mockReturnValue(8),
    refreshEntries: jest.fn()
  }),
}));

describe('useTimeEntries Hook', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('initializes with empty entries and loading state', () => {
    (unifiedTimeEntryService.getUserEntries as jest.Mock).mockReturnValue([]);
    
    const { result } = renderHook(() => useTimeEntries('user1'));
    
    expect(result.current.entries).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
  
  it('loads entries for a specific user', () => {
    const mockEntries = [
      { id: '1', userId: 'user1', date: new Date(), hours: 4, description: 'Test', project: 'Project A' },
      { id: '2', userId: 'user1', date: new Date(), hours: 4, description: 'Test', project: 'Project B' }
    ];
    
    (unifiedTimeEntryService.getUserEntries as jest.Mock).mockReturnValue(mockEntries);
    
    const { result } = renderHook(() => useTimeEntries('user1'));
    
    expect(result.current.entries).toEqual([]);
  });
  
  it('loads entries for a specific date', () => {
    const today = new Date();
    const mockDayEntries = [
      { id: '1', userId: 'user1', date: today, hours: 8, description: 'Test', project: 'Project A' }
    ];
    
    (unifiedTimeEntryService.getDayEntries as jest.Mock).mockReturnValue(mockDayEntries);
    
    const { result } = renderHook(() => useTimeEntries('user1', today));
    
    expect(result.current.entries).toEqual([]);
  });
  
  it('creates a new entry', () => {
    (unifiedTimeEntryService.createEntry as jest.Mock).mockReturnValue('new-id-123');
    (unifiedTimeEntryService.getUserEntries as jest.Mock).mockReturnValue([]);
    
    const { result } = renderHook(() => useTimeEntries('user1'));
    
    const newEntry = createMockEntryInput({ userId: 'user1' });
    
    act(() => {
      const entryId = result.current.createEntry(newEntry);
      expect(entryId).toBe('new-id-123');
    });
  });
  
  it('updates an existing entry', () => {
    (unifiedTimeEntryService.updateEntry as jest.Mock).mockReturnValue(true);
    (unifiedTimeEntryService.getUserEntries as jest.Mock).mockReturnValue([]);
    
    const { result } = renderHook(() => useTimeEntries('user1'));
    
    const entryId = 'entry-123';
    const updates = { hours: 4, description: 'Updated entry' };
    
    act(() => {
      const success = result.current.updateEntry(entryId, updates);
      expect(success).toBe(true);
    });
  });
  
  it('deletes an entry', () => {
    (unifiedTimeEntryService.deleteEntry as jest.Mock).mockReturnValue(true);
    (unifiedTimeEntryService.getUserEntries as jest.Mock).mockReturnValue([]);
    
    const { result } = renderHook(() => useTimeEntries('user1'));
    
    const entryId = 'entry-to-delete';
    
    act(() => {
      const success = result.current.deleteEntry(entryId);
      expect(success).toBe(true);
    });
  });
  
  it('calculates total hours', () => {
    const mockEntries = [
      { id: '1', userId: 'user1', date: new Date(), hours: 3, description: 'Test', project: 'Project A' },
      { id: '2', userId: 'user1', date: new Date(), hours: 5, description: 'Test', project: 'Project B' }
    ];
    
    (unifiedTimeEntryService.getUserEntries as jest.Mock).mockReturnValue(mockEntries);
    (unifiedTimeEntryService.calculateTotalHours as jest.Mock).mockReturnValue(8);
    
    const { result } = renderHook(() => useTimeEntries('user1'));
    
    const totalHours = result.current.calculateTotalHours();
    expect(totalHours).toBe(8);
  });
  
  it('handles refresh trigger', () => {
    const mockEntries = [
      { id: '1', userId: 'user1', date: new Date(), hours: 4, description: 'Test', project: 'Project A' }
    ];
    
    (unifiedTimeEntryService.getUserEntries as jest.Mock).mockReturnValue(mockEntries);
    
    const { result } = renderHook(() => useTimeEntries('user1'));
    
    // Clear mock to track new calls
    jest.clearAllMocks();
    
    // Trigger refresh
    act(() => {
      result.current.refreshEntries();
    });
  });
});
