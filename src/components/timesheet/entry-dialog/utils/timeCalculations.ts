
/**
 * Calculates the number of hours between a start and end time
 * @param startTime Time string in HH:MM format
 * @param endTime Time string in HH:MM format
 * @returns Number of hours as a float
 */
export const calculateHours = (startTime: string, endTime: string): number => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  let hoursDiff = endHours - startHours;
  let minutesDiff = endMinutes - startMinutes;
  
  if (minutesDiff < 0) {
    hoursDiff--;
    minutesDiff += 60;
  }
  
  return hoursDiff + (minutesDiff / 60);
};
