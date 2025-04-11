
import { AuthStateType } from '../AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { createAuthenticationOperations } from './authenticationOperations';
import { createSyncOperations } from './syncOperations';
import { createAuditOperations } from './auditOperations';

export const createAuthOperations = (
  state: AuthStateType, 
  toast: ReturnType<typeof useToast>,
  navigate: ReturnType<typeof useNavigate>
) => {
  const authenticationOperations = createAuthenticationOperations(state, toast, navigate);
  const syncOperations = createSyncOperations(state, toast);
  const auditOperations = createAuditOperations(state, toast);

  return {
    ...authenticationOperations,
    ...syncOperations,
    ...auditOperations
  };
};

export type AuthOperationsType = ReturnType<typeof createAuthOperations>;
