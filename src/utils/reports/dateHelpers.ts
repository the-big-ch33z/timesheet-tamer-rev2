
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
}

export const getWeekDateRange = (date: Date): DateRange => {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday start
    end: endOfWeek(date, { weekStartsOn: 1 })
  };
};

export const getMonthDateRange = (date: Date): DateRange => {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  };
};

export const isDateInRange = (date: Date | string, start: Date, end: Date): boolean => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return isWithinInterval(dateObj, { start, end });
};
