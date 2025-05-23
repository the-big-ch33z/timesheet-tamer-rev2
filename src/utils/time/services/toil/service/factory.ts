
import { TOILService } from "./main";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TOILService-Factory');

/**
 * Singleton instance of the TOILService
 */
export const toilService = new TOILService();

/**
 * Initialize the TOIL service
 * This function should be called when the application is ready
 */
export function initializeTOILService(): void {
  try {
    logger.debug('Initializing TOIL service...');
    toilService.initialize();
    logger.debug('TOIL service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize TOIL service:', error);
    throw error;
  }
}
