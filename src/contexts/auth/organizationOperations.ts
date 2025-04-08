
import { Organization } from '@/types';
import { AuthStateType } from './AuthProvider';

export const createOrganizationOperations = (state: AuthStateType) => {
  const getOrganizationById = (orgId: string) => {
    return state.organizations.find(org => org.id === orgId);
  };

  return {
    getOrganizationById
  };
};

export type OrganizationOperationsType = ReturnType<typeof createOrganizationOperations>;
