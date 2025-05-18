
import { Organization, Team, User } from '@/types';

// Flag to track if seed data has already been created in this session
let seedDataCreated = false;

// Create seed data if no users exist in the system and createDemoData is true
export const createSeedData = (createDemoData = false) => {
  // Skip if we've already created seed data in this session
  if (seedDataCreated) {
    console.log('Seed data creation skipped - already created in this session');
    return false;
  }

  const existingUsers = localStorage.getItem('users');
  const existingOrganizations = localStorage.getItem('organizations');
  
  // Only create seed data if it doesn't exist already and createDemoData is true
  if (createDemoData && (!existingUsers || JSON.parse(existingUsers).length === 0)) {
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
    
    seedDataCreated = true;
    console.log('Seed data created successfully');
    return true;
  }
  return false;
};

// Add a function to fix the nested userSchedules format if found
export const migrateUserSchedulesFormat = () => {
  try {
    const userSchedulesJson = localStorage.getItem('timesheet-app-user-schedules');
    if (!userSchedulesJson) return;

    let needsMigration = false;
    const userSchedules = JSON.parse(userSchedulesJson);
    const migratedData: Record<string, string> = {};

    // Check if any value is an object (nested structure) rather than a string
    Object.entries(userSchedules).forEach(([userId, scheduleData]) => {
      if (typeof scheduleData === 'object' && scheduleData !== null) {
        needsMigration = true;
        // Get the first schedule ID from the nested object (usually there's just one)
        const nestedValues = Object.values(scheduleData as Record<string, string>);
        if (nestedValues.length > 0) {
          migratedData[userId] = nestedValues[0];
        }
      } else if (typeof scheduleData === 'string') {
        // Already correct format
        migratedData[userId] = scheduleData as string;
      }
    });

    if (needsMigration) {
      console.log('Migrating user schedules from nested format to flat format');
      localStorage.setItem('timesheet-app-user-schedules', JSON.stringify(migratedData));
      console.log('User schedules migration complete');
    }
  } catch (error) {
    console.error('Error migrating user schedules format:', error);
  }
};

// This function will run data validation and fix any issues found
export const validateStorageFormat = () => {
  try {
    console.log('Validating storage format...');
    
    // Run the user schedules migration
    migrateUserSchedulesFormat();
    
    // Could add more validation for other storage keys here
    
    return true;
  } catch (error) {
    console.error('Error validating storage format:', error);
    return false;
  }
};
