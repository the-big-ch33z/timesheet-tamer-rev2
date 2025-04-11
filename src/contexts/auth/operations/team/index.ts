
import { AuthStateType } from '../../AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { createTeamBasicOperations } from './teamBasicOperations';
import { createTeamManagementOperations } from './teamManagementOperations';
import { createTeamMembershipOperations } from './teamMembershipOperations';

export const createTeamOperations = (state: AuthStateType, toast: ReturnType<typeof useToast>) => {
  const basicOperations = createTeamBasicOperations(state, toast);
  const managementOperations = createTeamManagementOperations(state, toast);
  const membershipOperations = createTeamMembershipOperations(state, toast);

  return {
    ...basicOperations,
    ...managementOperations,
    ...membershipOperations
  };
};

export type TeamOperationsType = ReturnType<typeof createTeamOperations>;

// Re-export types that might be needed elsewhere
export type { Team } from '@/types';
