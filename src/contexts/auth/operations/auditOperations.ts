
import { auditService } from '@/services/auditService';
import { AuthStateType } from '../AuthProvider';
import { useToast } from '@/hooks/use-toast';

export const createAuditOperations = (
  state: AuthStateType, 
  toast: ReturnType<typeof useToast>
) => {
  const getAuditLogs = async () => {
    try {
      if (!state.currentUser) {
        throw new Error("You must be logged in to view audit logs");
      }
      
      if (state.currentUser.role !== 'admin') {
        throw new Error("Only admins can view audit logs");
      }
      
      return await auditService.getLogs();
    } catch (error) {
      toast.toast({
        title: "Failed to retrieve audit logs",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    getAuditLogs
  };
};

export type AuditOperationsType = ReturnType<typeof createAuditOperations>;
