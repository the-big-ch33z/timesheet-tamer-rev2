
import { format, parse, isEqual } from "date-fns";

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD format
  region: string;
}

// Default Queensland holidays 
export const defaultQueenslandHolidays: Holiday[] = [
  { id: "1", name: "New Year's Day", date: "2025-01-01", region: "Queensland" },
  { id: "2", name: "Australia Day", date: "2025-01-26", region: "Queensland" },
  { id: "3", name: "Good Friday", date: "2025-04-18", region: "Queensland" },
  { id: "4", name: "Easter Monday", date: "2025-04-21", region: "Queensland" },
  { id: "5", name: "Anzac Day", date: "2025-04-25", region: "Queensland" },
  { id: "6", name: "Labour Day", date: "2025-05-05", region: "Queensland" },
  { id: "7", name: "Queen's Birthday", date: "2025-10-06", region: "Queensland" },
  { id: "8", name: "Christmas Day", date: "2025-12-25", region: "Queensland" },
  { id: "9", name: "Boxing Day", date: "2025-12-26", region: "Queensland" },
];

export function getHolidayForDate(date: Date, holidays: Holiday[]): Holiday | undefined {
  const formattedDate = format(date, "yyyy-MM-dd");
  return holidays.find(holiday => holiday.date === formattedDate);
}

export function isHoliday(date: Date, holidays: Holiday[]): boolean {
  return getHolidayForDate(date, holidays) !== undefined;
}

// Initialize holidays in localStorage if they don't exist
export function initializeHolidays(): Holiday[] {
  try {
    const storedHolidays = localStorage.getItem('holidays');
    if (!storedHolidays) {
      localStorage.setItem('holidays', JSON.stringify(defaultQueenslandHolidays));
      return defaultQueenslandHolidays;
    }
    return JSON.parse(storedHolidays);
  } catch (error) {
    console.error("Error initializing holidays:", error);
    return defaultQueenslandHolidays;
  }
}

// Save holidays to localStorage
export function saveHolidays(holidays: Holiday[]): void {
  try {
    localStorage.setItem('holidays', JSON.stringify(holidays));
  } catch (error) {
    console.error("Error saving holidays:", error);
  }
}

// Get holidays from localStorage
export function getHolidays(): Holiday[] {
  try {
    const storedHolidays = localStorage.getItem('holidays');
    if (storedHolidays) {
      return JSON.parse(storedHolidays);
    }
    return defaultQueenslandHolidays;
  } catch (error) {
    console.error("Error getting holidays:", error);
    return defaultQueenslandHolidays;
  }
}
