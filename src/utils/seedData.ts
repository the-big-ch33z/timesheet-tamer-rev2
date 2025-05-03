
import { Organization, Team, User } from '@/types';
import { format } from 'date-fns';

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
    
    // Add TOIL sample data for the current month
    createSampleTOILData(userId);
    
    console.log('Seed data created successfully');
    return true;
  }
  return false;
};

// Create sample TOIL data for demonstration
const createSampleTOILData = (userId: string) => {
  try {
    // Check if TOIL data already exists
    const existingTOILRecords = localStorage.getItem('toilRecords');
    if (existingTOILRecords && JSON.parse(existingTOILRecords).length > 0) {
      return; // Don't create data if it already exists
    }
    
    console.log('Creating sample TOIL data');
    
    // Get current month/year
    const now = new Date();
    const currentMonthYear = format(now, 'yyyy-MM');
    
    // Create some TOIL records for the current month
    const toilRecords = [
      {
        id: `toil-${Date.now()}-1`,
        userId,
        date: new Date(now.getFullYear(), now.getMonth(), 5), // 5th of current month
        hours: 4.5,
        monthYear: currentMonthYear,
        entryId: `entry-${Date.now()}-1`,
        status: 'active'
      },
      {
        id: `toil-${Date.now()}-2`,
        userId,
        date: new Date(now.getFullYear(), now.getMonth(), 12), // 12th of current month
        hours: 3.0,
        monthYear: currentMonthYear,
        entryId: `entry-${Date.now()}-2`,
        status: 'active'
      }
    ];
    
    // Create some TOIL usage records
    const toilUsage = [
      {
        id: `toilUsage-${Date.now()}-1`,
        userId,
        date: new Date(now.getFullYear(), now.getMonth(), 18), // 18th of current month
        hours: 2.0,
        entryId: `entry-${Date.now()}-3`,
        monthYear: currentMonthYear
      }
    ];
    
    // Store the TOIL data
    localStorage.setItem('toilRecords', JSON.stringify(toilRecords));
    localStorage.setItem('toilUsage', JSON.stringify(toilUsage));
    
    console.log('Sample TOIL data created successfully');
  } catch (error) {
    console.error('Error creating sample TOIL data:', error);
  }
};
