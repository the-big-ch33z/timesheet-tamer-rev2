
import { 
  calculateHoursFromTimes, 
  calculateMonthlyTargetHours,
  calculateAdjustedFortnightHours 
} from '../calculations';
import { TimeCalculationError } from '../errors/timeErrorHandling';
import { createTestWorkSchedule } from '@/utils/testing/mockUtils';
import { WorkSchedule } from '@/types';

describe('Time Calculations', () => {
  describe('calculateHoursFromTimes', () => {
    it('calculates hours between times correctly', () => {
      expect(calculateHoursFromTimes('09:00', '17:00')).toBe(8.0);
      expect(calculateHoursFromTimes('08:30', '12:00')).toBe(3.5);
      expect(calculateHoursFromTimes('13:45', '18:15')).toBe(4.5);
    });

    it('handles overnight shifts', () => {
      expect(calculateHoursFromTimes('22:00', '06:00')).toBe(8.0);
      expect(calculateHoursFromTimes('23:30', '07:45')).toBe(8.3);
    });

    it('throws error for invalid time formats', () => {
      expect(() => calculateHoursFromTimes('9:00', '17:00')).toThrow(TimeCalculationError);
      expect(() => calculateHoursFromTimes('09:00', '25:00')).toThrow(TimeCalculationError);
      expect(() => calculateHoursFromTimes('', '17:00')).toThrow(TimeCalculationError);
    });
  });

  describe('calculateMonthlyTargetHours', () => {
    it('calculates monthly target hours correctly', () => {
      // Mock date with exactly 20 workdays
      const mockDate = new Date('2023-01-01'); // January 2023
      jest.spyOn(require('../../time/scheduleUtils'), 'getWorkdaysInMonth').mockReturnValue(20);
      
      // Pass fortnightHours as first parameter, date as second parameter
      expect(calculateMonthlyTargetHours(70, mockDate)).toBe(140.0); // 70 hours per fortnight * 2
      expect(calculateMonthlyTargetHours(35, mockDate)).toBe(70.0);
    });

    it('handles direct workdays input', () => {
      // Create actual date objects instead of using numbers
      const mockDate1 = new Date('2023-03-01'); // March with ~22 workdays
      const mockDate2 = new Date('2023-02-01'); // February with ~19 workdays
      jest.spyOn(require('../../time/scheduleUtils'), 'getWorkdaysInMonth')
        .mockReturnValueOnce(22)  // First call returns 22
        .mockReturnValueOnce(19); // Second call returns 19
      
      // Pass fortnightHours as first parameter, date as second parameter
      expect(calculateMonthlyTargetHours(70, mockDate1)).toBe(154.0); // 70 * (22/10) = 154
      expect(calculateMonthlyTargetHours(38, mockDate2)).toBe(72.2); // 38 * (19/10) = 72.2
    });

    it('throws error for invalid inputs', () => {
      const mockDate = new Date('2023-01-01');
      expect(() => calculateMonthlyTargetHours(-5, mockDate)).toThrow(TimeCalculationError);
      
      // Use actual Date objects for these too
      const invalidDate1 = new Date('2000-01-01');
      const invalidDate2 = new Date('2000-01-01');
      
      // Mock getWorkdaysInMonth to return -1 and 32 for these cases
      jest.spyOn(require('../../time/scheduleUtils'), 'getWorkdaysInMonth')
        .mockReturnValueOnce(-1)  // First call returns invalid -1
        .mockReturnValueOnce(32); // Second call returns invalid 32
      
      // Pass fortnightHours as first parameter, date as second parameter
      expect(() => calculateMonthlyTargetHours(70, invalidDate1)).toThrow(TimeCalculationError);
      expect(() => calculateMonthlyTargetHours(70, invalidDate2)).toThrow(TimeCalculationError);
    });
  });

  describe('calculateAdjustedFortnightHours', () => {
    it('applies FTE to schedule hours', () => {
      const mockSchedule = createTestWorkSchedule();
      
      jest.spyOn(require('../../time/scheduleUtils'), 'calculateFortnightHoursFromSchedule').mockReturnValue(80);
      
      expect(calculateAdjustedFortnightHours(mockSchedule, 1.0)).toBe(80);
      expect(calculateAdjustedFortnightHours(mockSchedule, 0.5)).toBe(40);
      expect(calculateAdjustedFortnightHours(mockSchedule, 0.8)).toBe(64);
    });

    it('handles missing schedule', () => {
      expect(calculateAdjustedFortnightHours(undefined, 1.0)).toBe(0);
    });

    it('throws error for invalid FTE', () => {
      const mockSchedule = {} as WorkSchedule;
      expect(() => calculateAdjustedFortnightHours(mockSchedule, -0.5)).toThrow(TimeCalculationError);
      expect(() => calculateAdjustedFortnightHours(mockSchedule, 2.5)).toThrow(TimeCalculationError);
    });
  });
});
