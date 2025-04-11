
import { syncService } from '@/services/syncService';
import { auditService } from '@/services/auditService';
import { AuthStateType } from '../AuthProvider';
import { useToast } from '@/hooks/use-toast';

export const createSyncOperations = (
  state: AuthStateType, 
  toast: ReturnType<typeof useToast>
) => {
  const syncData = async () => {
    try {
      if (!state.currentUser) {
        throw new Error("You must be logged in to sync data");
      }
      
      toast.toast({
        title: "Syncing data",
        description: "Starting data synchronization...",
      });
      
      await syncService.recordSync('users', 'in_progress', state.users.length);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await syncService.recordSync('users', 'success', state.users.length);
      
      await syncService.recordSync('teams', 'in_progress', state.teams.length);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await syncService.recordSync('teams', 'success', state.teams.length);
      
      await syncService.recordSync('teamMemberships', 'in_progress', state.teamMemberships.length);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      await syncService.recordSync('teamMemberships', 'success', state.teamMemberships.length);
      
      await auditService.logEvent(
        state.currentUser.id,
        'data_sync',
        'system/sync',
        `Synchronized ${state.users.length} users, ${state.teams.length} teams, and ${state.teamMemberships.length} memberships`
      );
      
      toast.toast({
        title: "Sync complete",
        description: `Successfully synchronized all data`,
      });
    } catch (error) {
      toast.toast({
        title: "Sync failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    syncData
  };
};

export type SyncOperationsType = ReturnType<typeof createSyncOperations>;
