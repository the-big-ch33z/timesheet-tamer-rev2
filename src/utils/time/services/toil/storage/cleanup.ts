
import { loadTOILRecords, loadTOILUsage } from './core';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { cleanupDuplicateTOILRecords, cleanupDuplicateToilUsage } from './queries';

const logger = createTimeLogger('TOILCleanup');

// Clean up all TOIL data for a user
export async function cleanupAllToilData(userId: string): Promise<boolean> {
  try {
    if (!userId) {
      logger.error('No user ID provided for cleanup');
      return false;
    }
    
    logger.debug(`Running full TOIL cleanup for user ${userId}`);
    
    // Run both cleanup functions in sequence
    const [recordsCleanedCount, usagesCleanedCount] = await Promise.all([
      cleanupDuplicateTOILRecords(userId),
      cleanupDuplicateToilUsage(userId)
    ]);
    
    const totalCleaned = recordsCleanedCount + usagesCleanedCount;
    logger.debug(`Cleanup complete: removed ${recordsCleanedCount} duplicate records and ${usagesCleanedCount} duplicate usages`);
    
    return totalCleaned > 0;
  } catch (error) {
    logger.error('Error during TOIL cleanup:', error);
    return false;
  }
}

// Re-export the individual cleanup functions to make them available to importers
export { cleanupDuplicateTOILRecords, cleanupDuplicateToilUsage } from './queries';
