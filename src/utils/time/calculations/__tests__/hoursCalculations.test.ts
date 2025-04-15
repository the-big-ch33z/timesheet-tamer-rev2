
import { 
  calculateHoursFromTimes, 
  calculateMonthlyTargetHours,
  calculateAdjustedFortnightHours 
} from '../hoursCalculations';
import { TimeCalculationError } from '../../errors/timeErrorHandling';
import { createTestWorkSchedule } from '@/utils/testing/mockUtils';
import { WorkSchedule } from '@/types';  // Added WorkSchedule import

describe('Hours Calculation Utilities', () => {
  describe('calculateHoursFromTimes', () => {
    it('calculates regular work hours correctly', () => {
      expect(calculateHoursFromTimes('09:00', '17:00')).toBe(8.0); // Standard 8-hour day
      expect(calculateHoursFromTimes('08:30', '12:00')).toBe(3.5); // Morning only
      expect(calculateHoursFromTimes('13:00', '17:30')).toBe(4.5); // Afternoon only
      expect(calculateHoursFromTimes('08:00', '16:30')).toBe(8.5); // With half hour
    });

    it('handles partial hours with correct rounding', () => {
      expect(calculateHoursFromTimes('09:00', '09:30')).toBe(0.5); // Half hour
      expect(calculateHoursFromTimes('09:00', '09:15')).toBe(0.3); // Quarter hour (rounded to 0.3)
      expect(calculateHoursFromTimes('09:00', '09:45')).toBe(0.8); // Three-quarters hour (rounded to 0.8)
    });

    it('handles overnight shifts correctly', () => {
      expect(calculateHoursFromTimes('22:00', '06:00')).toBe(8.0); // Standard overnight
      expect(calculateHoursFromTimes('23:30', '07:45')).toBe(8.3); // Overnight with partial hours
      expect(calculateHoursFromTimes('18:00', '02:00')).toBe(8.0); // Evening to early morning
    });

    it('throws error for invalid time formats', () => {
      expect(() => calculateHoursFromTimes('9:00', '17:00')).toThrow(TimeCalculationError); // Missing leading zero
      expect(() => calculateHoursFromTimes('09:00', '25:00')).toThrow(TimeCalculationError); // Invalid hour
      expect(() => calculateHoursFromTimes('09:60', '17:00')).toThrow(TimeCalculationError); // Invalid minute
      expect(() => calculateHoursFromTimes('', '17:00')).toThrow(TimeCalculationError); // Empty start time
      expect(() => calculateHoursFromTimes('09:00', '')).toThrow(TimeCalculationError); // Empty end time
    });
  });

  describe('calculateMonthlyTargetHours', () => {
    it('calculates monthly target hours correctly based on fortnight hours', () => {
      // Mock date with exactly 20 workdays
      const mockDate = new Date('2023-01-01'); // January 2023
      jest.spyOn(require('../../scheduleUtils'), 'getWorkdaysInMonth').mockReturnValue(20);
      
      expect(calculateMonthlyTargetHours(70, mockDate)).toBe(140.0); // 70 hours per fortnight * 2
      expect(calculateMonthlyTargetHours(35, mockDate)).toBe(70.0); // 35 hours per fortnight * 2
      expect(calculateMonthlyTargetHours(76, mockDate)).toBe(152.0); // 76 hours per fortnight * 2
    });

    it('handles months with non-standard number of workdays', () => {
      // Mock dates with different workday counts
      const mockDateFeb = new Date('2023-02-01'); // February 2023
      jest.spyOn(require('../../scheduleUtils'), 'getWorkdaysInMonth').mockReturnValueOnce(19); // Feb might have 19 workdays
      
      const mockDateMar = new Date('2023-03-01'); // March 2023
      jest.spyOn(require('../../scheduleUtils'), 'getWorkdaysInMonth').mockReturnValueOnce(23); // March might have 23 workdays
      
      expect(calculateMonthlyTargetHours(70, mockDateFeb)).toBe(133.0); // 70 * (19/10) = 133.0
      expect(calculateMonthlyTargetHours(70, mockDateMar)).toBe(161.0); // 70 * (23/10) = 161.0
    });

    it('handles direct workdays input instead of date', () => {
      expect(calculateMonthlyTargetHours(70, 22)).toBe(154.0); // 70 * (22/10)
      expect(calculateMonthlyTargetHours(38, 19)).toBe(72.2); // 38 * (19/10) = 72.2
    });

    it('throws error for invalid inputs', () => {
      expect(() => calculateMonthlyTargetHours(-5, 20)).toThrow(TimeCalculationError); // Negative fortnight hours
      expect(() => calculateMonthlyTargetHours(70, -1)).toThrow(TimeCalculationError); // Negative workdays
      expect(() => calculateMonthlyTargetHours(0, 20)).not.toThrow(); // Zero is valid (e.g., unpaid leave)
      expect(() => calculateMonthlyTargetHours(70, 32)).toThrow(TimeCalculationError); // Too many workdays
    });
  });

  describe('calculateAdjustedFortnightHours', () => {
    it('applies FTE adjustment to full schedule hours', () => {
      const mockSchedule = createTestWorkSchedule();
      
      jest.spyOn(require('../../scheduleUtils'), 'calculateFortnightHoursFromSchedule').mockReturnValue(80);
      
      expect(calculateAdjustedFortnightHours(mockSchedule, 1.0)).toBe(80);
      expect(calculateAdjustedFortnightHours(mockSchedule, 0.5)).toBe(40);
      expect(calculateAdjustedFortnightHours(mockSchedule, 0.8)).toBe(64);
    });

    it('handles missing schedule gracefully', () => {
      expect(calculateAdjustedFortnightHours(undefined, 1.0)).toBe(0);
      expect(calculateAdjustedFortnightHours(null as any, 0.5)).toBe(0);
    });

    it('throws error for invalid FTE values', () => {
      const mockSchedule = {} as WorkSchedule;
      expect(() => calculateAdjustedFortnightHours(mockSchedule, -0.5)).toThrow(TimeCalculationError); // Negative FTE
      expect(() => calculateAdjustedFortnightHours(mockSchedule, 2.5)).toThrow(TimeCalculationError); // FTE > 2.0
    });
  });
});
