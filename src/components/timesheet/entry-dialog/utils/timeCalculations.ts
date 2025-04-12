
/**
 * Calculate hours between two time strings (HH:MM format)
 * @param startTime Start time in HH:MM format
 * @param endTime End time in HH:MM format 
 * @returns Number of hours as a decimal
 */
export const calculateHoursFromTimes = (startTime: string, endTime: string): number => {
  try {
    // Parse hours and minutes
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Calculate total minutes for start and end
    const startTotalMinutes = (startHour * 60) + startMinute;
    const endTotalMinutes = (endHour * 60) + endMinute;
    
    // Calculate difference in minutes
    let diffMinutes = endTotalMinutes - startTotalMinutes;
    
    // Handle overnight shifts
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Add 24 hours in minutes
    }
    
    // Convert minutes to decimal hours
    return Math.round((diffMinutes / 60) * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error("Error calculating hours from times:", error);
    return 0;
  }
};

/**
 * Format a decimal hours value to a string with one decimal place
 * @param hours Hours as a number
 * @returns Formatted string with one decimal place
 */
export const formatHours = (hours: number): string => {
  return hours.toFixed(1);
};
