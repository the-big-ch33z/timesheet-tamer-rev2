
import { 
  validateTime, 
  validateTimeOrder,
  isValidTimeFormat,
  validateTimeFormat
} from '../timeValidation';
import { TimeValidationError } from '../../errors/timeErrorHandling';

describe('Time Validation Utilities', () => {
  describe('isValidTimeFormat', () => {
    it('validates correct time formats', () => {
      expect(isValidTimeFormat('00:00')).toBe(true);
      expect(isValidTimeFormat('09:30')).toBe(true);
      expect(isValidTimeFormat('13:45')).toBe(true);
      expect(isValidTimeFormat('23:59')).toBe(true);
    });
    
    it('rejects incorrect time formats', () => {
      expect(isValidTimeFormat('9:30')).toBe(false); // Missing leading zero
      expect(isValidTimeFormat('24:00')).toBe(false); // Hour too large
      expect(isValidTimeFormat('12:60')).toBe(false); // Minute too large
      expect(isValidTimeFormat('12.30')).toBe(false); // Wrong separator
      expect(isValidTimeFormat('')).toBe(false); // Empty string
      expect(isValidTimeFormat('abcd')).toBe(false); // Not a time
    });
  });
  
  describe('validateTimeFormat', () => {
    it('validates correct time strings without throwing', () => {
      expect(() => validateTimeFormat('00:00', 'Start time')).not.toThrow();
      expect(() => validateTimeFormat('09:30', 'End time')).not.toThrow();
      expect(() => validateTimeFormat('23:59', 'Break time')).not.toThrow();
    });
    
    it('throws with proper context for invalid times', () => {
      expect(() => validateTimeFormat('9:30', 'Start time')).toThrow(TimeValidationError);
      expect(() => validateTimeFormat('24:00', 'End time')).toThrow(TimeValidationError);
      expect(() => validateTimeFormat('', 'Break time')).toThrow(TimeValidationError);
      
      // Check for context in error messages
      try {
        validateTimeFormat('9:30', 'Start time');
      } catch (error) {
        expect(error instanceof TimeValidationError).toBe(true);
        expect((error as Error).message).toContain('Start time');
      }
    });
  });
  
  describe('validateTimeOrder', () => {
    it('validates correctly ordered times', () => {
      expect(validateTimeOrder('09:00', '17:00')).toEqual({ valid: true });
      expect(validateTimeOrder('09:00', '09:30')).toEqual({ valid: true });
      expect(validateTimeOrder('23:00', '23:59')).toEqual({ valid: true });
    });
    
    it('validates overnight shifts as valid', () => {
      expect(validateTimeOrder('22:00', '06:00')).toEqual({ valid: true }); // Overnight
      expect(validateTimeOrder('18:30', '02:45')).toEqual({ valid: true }); // Evening to early morning
    });
    
    it('detects invalid time order with meaningful message', () => {
      // Same time (special case, could be valid depending on business rules)
      const sameTimeResult = validateTimeOrder('09:00', '09:00');
      expect(sameTimeResult.valid).toBe(false);
      expect(sameTimeResult.message).toContain('same');
      
      // Clearly invalid time order
      const invalidOrderResult = validateTimeOrder('17:00', '09:00');
      expect(invalidOrderResult.valid).toBe(false);
      expect(invalidOrderResult.message).toContain('before');
    });
    
    it('handles empty inputs gracefully', () => {
      // If either time is empty, consider it valid (partial input scenario)
      expect(validateTimeOrder('', '17:00')).toEqual({ valid: true });
      expect(validateTimeOrder('09:00', '')).toEqual({ valid: true });
      expect(validateTimeOrder('', '')).toEqual({ valid: true });
    });
  });
});
