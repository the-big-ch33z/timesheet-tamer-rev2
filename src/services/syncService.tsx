
import { SyncStatus } from '@/types';

/**
 * Service for handling data synchronization with a future database
 */
export const syncService = {
  /**
   * Record a sync event
   */
  recordSync: (
    entityType: string,
    status: 'success' | 'failed' | 'in_progress',
    recordsProcessed?: number
  ): Promise<SyncStatus> => {
    const syncStatus: SyncStatus = {
      lastSyncedAt: new Date().toISOString(),
      entityType,
      status,
      recordsProcessed
    };
    
    // Store sync status in localStorage for now
    // In a real app, this would be sent to a server
    const existingStatuses = localStorage.getItem('syncStatuses');
    const statuses = existingStatuses ? JSON.parse(existingStatuses) : [];
    
    // Update existing status or add new one
    const existingStatusIndex = statuses.findIndex(
      (s: SyncStatus) => s.entityType === entityType
    );
    
    if (existingStatusIndex >= 0) {
      statuses[existingStatusIndex] = syncStatus;
    } else {
      statuses.push(syncStatus);
    }
    
    localStorage.setItem('syncStatuses', JSON.stringify(statuses));
    
    // Log to console for debugging
    console.log('Sync status recorded:', syncStatus);
    
    return Promise.resolve(syncStatus);
  },
  
  /**
   * Get the latest sync status for all entity types
   */
  getSyncStatuses: (): Promise<SyncStatus[]> => {
    const statuses = localStorage.getItem('syncStatuses');
    return Promise.resolve(statuses ? JSON.parse(statuses) : []);
  },
  
  /**
   * Get the latest sync status for a specific entity type
   */
  getSyncStatus: (entityType: string): Promise<SyncStatus | null> => {
    const statuses = localStorage.getItem('syncStatuses');
    const parsedStatuses = statuses ? JSON.parse(statuses) : [];
    const status = parsedStatuses.find((s: SyncStatus) => s.entityType === entityType);
    return Promise.resolve(status || null);
  }
};
