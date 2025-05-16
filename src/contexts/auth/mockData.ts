
import { User, UserRole, Team, Organization, TeamMembership } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    workScheduleId: 'default'
  },
  {
    id: 'user-2',
    name: 'Manager User',
    email: 'manager@example.com',
    role: 'manager',
    status: 'active',
    createdAt: new Date().toISOString(),
    workScheduleId: 'default'
  },
  {
    id: 'user-3',
    name: 'Team Member',
    email: 'team-member@example.com',
    role: 'team-member',
    status: 'active',
    createdAt: new Date().toISOString(),
    workScheduleId: 'default'
  }
];

// Mock Teams
export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Development Team',
    managerId: 'user-2',
    organizationId: 'org-1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'team-2',
    name: 'Design Team',
    managerId: 'user-2',
    organizationId: 'org-1',
    createdAt: new Date().toISOString()
  }
];

// Mock Organizations
export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Example Organization',
    createdAt: new Date().toISOString()
  }
];

// Mock Team Memberships
export const mockTeamMemberships: TeamMembership[] = [
  {
    id: 'membership-1',
    userId: 'user-3',
    teamId: 'team-1',
    createdAt: new Date().toISOString()
  }
];
