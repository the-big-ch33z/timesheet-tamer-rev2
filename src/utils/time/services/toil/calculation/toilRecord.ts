
import { TimeEntry } from "@/types";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { TOILRecord } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TOILRecord');

/**
 * Create a new TOIL record
 */
export function createTOILRecord(
  userId: string, 
  date: Date, 
  hours: number,
  entryId?: string
): TOILRecord {
  const dateString = format(date, 'yyyy-MM-dd');
  logger.debug(`Creating TOIL record: ${userId}, date: ${dateString}, hours: ${hours}`);
  
  // Ensure hours value is a valid number and not too small (minimum 0.25)
  const validHours = isNaN(hours) || hours < 0.01 ? 0 : Math.round(hours * 4) / 4;
  
  if (validHours <= 0) {
    logger.debug(`Not creating TOIL record for ${dateString} as hours (${hours}) are invalid or zero`);
  } else {
    logger.debug(`Created valid TOIL record with ${validHours} hours for ${dateString}`);
  }
  
  return {
    id: uuidv4(),
    userId,
    date: new Date(date),
    hours: validHours,
    monthYear: format(date, 'yyyy-MM'),
    entryId: entryId || uuidv4(), // If no entry ID provided, create a synthetic one
    status: 'active'
  };
}
