
import { renderHook, act } from '@testing-library/react';
import { useWorkHours } from '../useWorkHours';
import { WorkHoursData } from '@/contexts/timesheet/types';

// Mock the work hours context
jest.mock('@/contexts/timesheet/work-hours-context/WorkHoursContext', () => ({
  useWorkHoursContext: () => ({
    getWorkHours: jest.fn((userId, date) => {
      if (userId === 'user-with-custom-hours') {
        return { startTime: '08:00', endTime: '16:00', isCustom: true };
      }
      return { startTime: '', endTime: '', isCustom: false };
    }),
    saveWorkHours: jest.fn(),
    hasCustomWorkHours: jest.fn((userId, date) => userId === 'user-with-custom-hours'),
    resetDayWorkHours: jest.fn(),
    getWorkHoursForDate: jest.fn((date, userId) => {
      if (userId === 'user-with-custom-hours') {
        return { 
          startTime: '08:00', 
          endTime: '16:00', 
          isCustom: true, 
          hasData: true,
          calculatedHours: 8
        };
      }
      return { 
        startTime: '', 
        endTime: '', 
        isCustom: false, 
        hasData: false,
        calculatedHours: 0
      };
    })
  }),
}));

// Mock the time calculations
jest.mock('@/utils/time/calculations', () => ({
  calculateHoursFromTimes: jest.fn((start, end) => {
    if (start === '08:00' && end === '16:00') return 8;
    if (start === '09:00' && end === '17:00') return 8;
    return 0;
  })
}));

// Mock the logger
jest.mock('@/utils/time/errors/timeLogger', () => ({
  createTimeLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock use-toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('useWorkHours Hook', () => {
  it('initializes with proper defaults', () => {
    const { result } = renderHook(() => useWorkHours());
    
    // Default work hours should be empty
    expect(result.current.getWorkHoursForDate(new Date())).toEqual(expect.objectContaining({
      startTime: '',
      endTime: '',
      isCustom: false,
      hasData: false
    }));
  });
  
  it('gets custom work hours for a user', () => {
    const testDate = new Date();
    const { result } = renderHook(() => useWorkHours('user-with-custom-hours'));
    
    const workHours = result.current.getWorkHoursForDate(testDate);
    
    expect(workHours).toEqual(expect.objectContaining({
      startTime: '08:00',
      endTime: '16:00',
      isCustom: true,
      hasData: true
    }));
  });
  
  it('calculates hours correctly from work hours', () => {
    const testDate = new Date();
    const { result } = renderHook(() => useWorkHours('user-with-custom-hours'));
    
    const workHours = result.current.getWorkHoursForDate(testDate);
    
    // Should calculate 8 hours from 8:00 to 16:00
    expect(workHours.calculatedHours).toBe(8);
  });
  
  it('saves work hours correctly', () => {
    const testDate = new Date();
    const { result } = renderHook(() => useWorkHours('test-user'));
    
    // Mock the context methods to spy on them
    const mockWorkHoursContext = require('@/contexts/timesheet/work-hours-context/WorkHoursContext').useWorkHoursContext();
    
    act(() => {
      const success = result.current.saveWorkHoursForDate(testDate, '09:00', '17:00', 'test-user');
      expect(success).toBe(true);
    });
    
    // Check if the context's saveWorkHours was called with the right parameters
    expect(mockWorkHoursContext.saveWorkHours).toHaveBeenCalledWith(
      'test-user',
      expect.any(String),
      '09:00',
      '17:00'
    );
  });
  
  it('checks for custom hours correctly', () => {
    const testDate = new Date();
    const { result } = renderHook(() => useWorkHours());
    
    // User with custom hours
    expect(result.current.hasCustomHours(testDate, 'user-with-custom-hours')).toBe(true);
    
    // User without custom hours
    expect(result.current.hasCustomHours(testDate, 'user-without-custom-hours')).toBe(false);
  });
  
  it('resets work hours to defaults', () => {
    const testDate = new Date();
    const { result } = renderHook(() => useWorkHours('test-user'));
    
    // Mock the context methods to spy on them
    const mockWorkHoursContext = require('@/contexts/timesheet/work-hours-context/WorkHoursContext').useWorkHoursContext();
    
    act(() => {
      result.current.resetWorkHours(testDate, 'test-user');
    });
    
    // Check if the context's resetDayWorkHours was called with the right parameters
    expect(mockWorkHoursContext.resetDayWorkHours).toHaveBeenCalledWith(
      'test-user',
      expect.any(String)
    );
  });
  
  it('calculates day hours correctly', () => {
    const testDate = new Date();
    const { result } = renderHook(() => useWorkHours('user-with-custom-hours'));
    
    const hours = result.current.calculateDayHours(testDate);
    
    // Should get 8 hours from the user's custom hours
    expect(hours).toBe(8);
  });
  
  it('calculates auto hours correctly', () => {
    const { result } = renderHook(() => useWorkHours());
    
    const hours = result.current.calculateAutoHours('08:00', '16:00');
    
    expect(hours).toBe(8);
  });
});
