
import { Organization, Team, User } from '@/types';

// Create seed data if no users exist in the system
export const createSeedData = () => {
  const existingUsers = localStorage.getItem('users');
  const existingOrganizations = localStorage.getItem('organizations');
  
  // Only create seed data if it doesn't exist already
  if (!existingUsers || JSON.parse(existingUsers).length === 0) {
    console.log('Creating seed data for initial application use');
    
    const userId = `user-${Date.now()}`;
    const orgId = `org-${Date.now()}`;
    const teamId = `team-${Date.now()}`;
    
    // Create default organization
    const defaultOrg: Organization = {
      id: orgId,
      name: 'Demo Organization',
      ownerId: userId,
      createdAt: new Date().toISOString()
    };
    
    // Create default team
    const defaultTeam: Team = {
      id: teamId,
      name: 'Demo Team',
      organizationId: orgId,
      managerId: userId,
      createdAt: new Date().toISOString()
    };
    
    // Create default admin user
    const defaultUser: User = {
      id: userId,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      organizationId: orgId,
      teamIds: [teamId],
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    // Store in localStorage
    localStorage.setItem('users', JSON.stringify([defaultUser]));
    localStorage.setItem('organizations', JSON.stringify([defaultOrg]));
    localStorage.setItem('teams', JSON.stringify([defaultTeam]));
    localStorage.setItem('teamMemberships', JSON.stringify([{
      id: `membership-${Date.now()}`,
      teamId,
      userId,
      managerId: userId,
      joinedAt: new Date().toISOString()
    }]));
    
    console.log('Seed data created successfully');
    return true;
  }
  return false;
};
