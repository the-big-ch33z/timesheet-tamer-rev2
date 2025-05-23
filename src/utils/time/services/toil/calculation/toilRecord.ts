
import { v4 as uuidv4 } from "uuid";
import { TOILRecord } from "@/types/toil";
import { format } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TOILCalculation-Record');

/**
 * Create a new TOIL record
 */
export function createTOILRecord(
  userId: string, 
  date: Date, 
  hours: number,
  entryId?: string
): TOILRecord {
  logger.debug(`Creating TOIL record: ${userId}, date: ${format(date, 'yyyy-MM-dd')}, hours: ${hours}`);
  
  return {
    id: uuidv4(),
    userId,
    date: new Date(date),
    hours,
    monthYear: format(date, 'yyyy-MM'),
    entryId: entryId || uuidv4(), // If no entry ID provided, create a synthetic one
    status: 'active'
  };
}
