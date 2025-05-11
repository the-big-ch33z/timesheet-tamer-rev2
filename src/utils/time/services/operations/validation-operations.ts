
import { TimeEntryOperationsConfig } from "./types";
import { TimeEntry } from "@/types";
import { createTimeLogger } from "../../errors";

const logger = createTimeLogger('ValidationOperations');

/**
 * Class to handle validation operations for time entries
 */
export class ValidationOperations {
  private serviceName: string;
  
  constructor(config: TimeEntryOperationsConfig = {}) {
    this.serviceName = config.serviceName ?? "TimeEntryService";
    logger.debug(`ValidationOperations initialized for ${this.serviceName}`);
    console.log(`[ValidationOperations] ValidationOperations initialized for ${this.serviceName}`);
  }
  
  /**
   * Validate a time entry against rules
   */
  public validateTimeEntry(entry: Partial<TimeEntry>): boolean {
    logger.debug(`Validating time entry`, entry);
    
    if (!entry) return false;
    
    // Basic validation
    if (entry.hours !== undefined && (isNaN(entry.hours) || entry.hours < 0)) {
      logger.error(`Invalid hours value: ${entry.hours}`);
      return false;
    }
    
    // Date validation
    if (entry.date && !(entry.date instanceof Date) && isNaN(new Date(entry.date).getTime())) {
      logger.error(`Invalid date: ${entry.date}`);
      return false;
    }
    
    return true;
  }
}
