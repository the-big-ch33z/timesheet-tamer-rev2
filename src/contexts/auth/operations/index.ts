
import { AuthStateType } from '../AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { createUserBasicOperations } from './userBasicOperations';
import { createUserCreationOperations } from './userCreationOperations';
import { createUserStatusOperations } from './userStatusOperations';

export const createUserOperations = (state: AuthStateType, toast: ReturnType<typeof useToast>) => {
  const basicOperations = createUserBasicOperations(state, toast);
  const creationOperations = createUserCreationOperations(state, toast);
  const statusOperations = createUserStatusOperations(state, toast);

  return {
    ...basicOperations,
    ...creationOperations,
    ...statusOperations
  };
};

export type UserOperationsType = ReturnType<typeof createUserOperations>;

// Re-export types
export type { UserMetrics } from './types';

