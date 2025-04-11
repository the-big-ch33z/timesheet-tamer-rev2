
import { Team } from '@/types';
import { AuthStateType } from '../../AuthProvider';
import { useToast } from '@/hooks/use-toast';

export const createTeamBasicOperations = (
  state: AuthStateType, 
  toast: ReturnType<typeof useToast>
) => {
  const getTeamById = (teamId: string) => {
    return state.teams.find(team => team.id === teamId);
  };

  const getTeamsByManager = (managerId: string) => {
    return state.teams.filter(team => team.managerId === managerId);
  };

  return {
    getTeamById,
    getTeamsByManager
  };
};

export type TeamBasicOperationsType = ReturnType<typeof createTeamBasicOperations>;
