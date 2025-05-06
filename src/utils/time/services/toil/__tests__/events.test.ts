
import { dispatchTOILEvent, dispatchTOILErrorEvent, triggerTOILSave } from '../events';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { TOILSummary } from '@/types/toil';

// Mock timeEventsService
jest.mock('@/utils/time/events/timeEventsService', () => ({
  timeEventsService: {
    publish: jest.fn()
  }
}));

// Mock createTimeLogger
jest.mock('@/utils/time/errors', () => ({
  createTimeLogger: () => ({
    debug: jest.fn(),
    error: jest.fn()
  })
}));

describe('TOIL Events', () => {
  let windowEventsSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Setup spy on window.dispatchEvent
    windowEventsSpy = jest.spyOn(window, 'dispatchEvent');
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    windowEventsSpy.mockRestore();
  });
  
  describe('triggerTOILSave', () => {
    it('should trigger a save event', () => {
      const result = triggerTOILSave();
      
      expect(result).toBe(true);
      expect(windowEventsSpy).toHaveBeenCalledTimes(1);
      expect(windowEventsSpy.mock.calls[0][0].type).toBe('toil:save-pending-changes');
    });
    
    it('should debounce rapid calls', () => {
      triggerTOILSave();
      const result = triggerTOILSave();
      
      expect(result).toBe(false);
      expect(windowEventsSpy).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('dispatchTOILEvent', () => {
    it('should dispatch an event with valid summary', () => {
      const summary: TOILSummary = {
        userId: 'test-user',
        monthYear: '2025-05',
        accrued: 10,
        used: 2,
        remaining: 8
      };
      
      const result = dispatchTOILEvent(summary);
      
      expect(result).toBe(true);
      expect(windowEventsSpy).toHaveBeenCalledTimes(1);
      expect(windowEventsSpy.mock.calls[0][0].type).toBe('toil:summary-updated');
      expect(timeEventsService.publish).toHaveBeenCalledWith('toil-updated', expect.objectContaining({
        userId: 'test-user',
        monthYear: '2025-05',
        summary
      }));
    });
    
    it('should handle invalid summary gracefully', () => {
      // @ts-ignore - intentionally passing invalid data
      const result = dispatchTOILEvent(null);
      
      expect(result).toBe(false);
      expect(windowEventsSpy).not.toHaveBeenCalled();
      expect(timeEventsService.publish).not.toHaveBeenCalled();
    });
    
    it('should catch and handle errors', () => {
      windowEventsSpy.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const summary: TOILSummary = {
        userId: 'test-user',
        monthYear: '2025-05',
        accrued: 10,
        used: 2,
        remaining: 8
      };
      
      const result = dispatchTOILEvent(summary);
      
      expect(result).toBe(false);
    });
  });
  
  describe('dispatchTOILErrorEvent', () => {
    it('should dispatch an error event', () => {
      const errorMessage = 'Test error message';
      const errorData = { details: 'test details' };
      
      const result = dispatchTOILErrorEvent(errorMessage, errorData, 'test-user');
      
      expect(result).toBe(true);
      expect(windowEventsSpy).toHaveBeenCalledTimes(1);
      expect(windowEventsSpy.mock.calls[0][0].type).toBe('toil:error');
      expect(timeEventsService.publish).toHaveBeenCalledWith(
        'toil-error', 
        expect.objectContaining({
          message: errorMessage,
          data: errorData,
          userId: 'test-user'
        })
      );
    });
    
    it('should handle errors gracefully', () => {
      windowEventsSpy.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = dispatchTOILErrorEvent('Error message');
      
      expect(result).toBe(false);
    });
  });
});
