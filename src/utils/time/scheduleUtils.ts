
/**
 * Work schedule utility functions
 */

/**
 * Calculate day hours with break adjustments
 * 
 * @param startTime Start time string in format "HH:MM"
 * @param endTime End time string in format "HH:MM"
 * @param breaks Configuration for breaks (lunch, smoko)
 * @returns number Total hours for the day with breaks subtracted
 */
export function calculateDayHoursWithBreaks(
  startTime: string,
  endTime: string,
  breaks: { lunch?: boolean; smoko?: boolean } = { lunch: true, smoko: true }
): number {
  try {
    // Parse times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    // Calculate minutes
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Calculate break minutes
    const lunchMinutes = breaks.lunch ? 30 : 0;
    const smokoMinutes = breaks.smoko ? 15 : 0;
    
    // Calculate total minutes
    const totalMinutes = endMinutes - startMinutes - lunchMinutes - smokoMinutes;
    
    // Convert to hours
    const hours = totalMinutes / 60;
    
    // Return rounded to 2 decimal places
    return Math.round(hours * 100) / 100;
  } catch (error) {
    console.error('Error calculating day hours:', error);
    return 0;
  }
}
