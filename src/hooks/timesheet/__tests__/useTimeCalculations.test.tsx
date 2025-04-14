
import { renderHook } from '@testing-library/react';
import { useTimeCalculations } from '../useTimeCalculations';

// Mock the logger
jest.mock('@/utils/time/errors/timeLogger', () => ({
  createTimeLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock the calculation utilities
jest.mock('@/utils/time/calculations', () => ({
  calculateHoursFromTimes: jest.fn((start, end) => {
    // Simple mock implementation
    if (!start || !end) return 0;
    if (start === '09:00' && end === '17:00') return 8;
    if (start === '08:30' && end === '12:00') return 3.5;
    if (start === '13:00' && end === '17:30') return 4.5;
    if (start === 'invalid') throw new Error('Invalid time');
    return 0;
  })
}));

// Mock the validation utilities
jest.mock('@/utils/time/validation', () => ({
  validateTimeOrder: jest.fn((start, end) => {
    // Simple mock implementation
    if (!start || !end) return { valid: true };
    if (start === end) return { valid: false, message: 'Start and end times cannot be the same' };
    if (start > end && end !== '00:00') return { valid: false, message: 'Start time must be before end time' };
    return { valid: true };
  })
}));

describe('useTimeCalculations Hook', () => {
  it('correctly calculates hours between times', () => {
    const { result } = renderHook(() => useTimeCalculations());
    
    expect(result.current.calculateHours('09:00', '17:00')).toBe(8);
    expect(result.current.calculateHours('08:30', '12:00')).toBe(3.5);
    expect(result.current.calculateHours('13:00', '17:30')).toBe(4.5);
  });
  
  it('returns 0 for empty time inputs', () => {
    const { result } = renderHook(() => useTimeCalculations());
    
    expect(result.current.calculateHours('', '17:00')).toBe(0);
    expect(result.current.calculateHours('09:00', '')).toBe(0);
    expect(result.current.calculateHours('', '')).toBe(0);
  });
  
  it('handles errors in calculation', () => {
    const { result } = renderHook(() => useTimeCalculations());
    
    expect(result.current.calculateHours('invalid', '17:00')).toBe(0);
  });
  
  it('validates time inputs correctly', () => {
    const { result } = renderHook(() => useTimeCalculations());
    
    // Valid times
    expect(result.current.validateTimes('09:00', '17:00').valid).toBe(true);
    
    // Invalid - same times
    const sameTimeResult = result.current.validateTimes('09:00', '09:00');
    expect(sameTimeResult.valid).toBe(false);
    expect(sameTimeResult.message).toBeDefined();
    
    // Invalid - end before start
    const wrongOrderResult = result.current.validateTimes('17:00', '09:00');
    expect(wrongOrderResult.valid).toBe(false);
    expect(wrongOrderResult.message).toBeDefined();
    
    // Empty times considered valid
    expect(result.current.validateTimes('', '17:00').valid).toBe(true);
    expect(result.current.validateTimes('09:00', '').valid).toBe(true);
  });
  
  it('formats time for display correctly', () => {
    const { result } = renderHook(() => useTimeCalculations());
    
    expect(result.current.formatTimeForDisplay('09:00')).toBe('9:00 AM');
    expect(result.current.formatTimeForDisplay('13:30')).toBe('1:30 PM');
    expect(result.current.formatTimeForDisplay('00:00')).toBe('12:00 AM');
    expect(result.current.formatTimeForDisplay('12:00')).toBe('12:00 PM');
    
    // Handles empty string
    expect(result.current.formatTimeForDisplay('')).toBe('');
    
    // Returns original value if parsing fails
    expect(result.current.formatTimeForDisplay('not-a-time')).toBe('not-a-time');
  });
});
