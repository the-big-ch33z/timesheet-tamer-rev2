
import { User, Team, Organization, WorkSchedule, TeamMembership, TimeEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Enhanced logging for seed data operations
const timestamp = () => new Date().toISOString();
const log = (message: string, data?: any) => {
  console.log(`[${timestamp()}] SEED_DATA: ${message}`, data || '');
};

/**
 * Validate and fix storage format issues
 */
export async function validateStorageFormat(): Promise<void> {
  log("===== STORAGE FORMAT VALIDATION STARTED =====");
  
  try {
    log("Checking localStorage availability...");
    if (typeof localStorage === 'undefined') {
      log("⚠️ LocalStorage not available, skipping validation");
      return;
    }
    log("✅ LocalStorage is available");

    const keysToValidate = [
      'currentUser',
      'users', 
      'teams',
      'organizations',
      'teamMemberships',
      'time-entries'
    ];

    log("Validating stored data formats...");
    
    for (const key of keysToValidate) {
      try {
        log(`Validating key: ${key}`);
        const storedValue = localStorage.getItem(key);
        
        if (storedValue) {
          JSON.parse(storedValue);
          log(`✅ ${key} format is valid`);
        } else {
          log(`ℹ️ ${key} not found in storage (this is ok)`);
        }
      } catch (parseError) {
        console.error(`[${timestamp()}] SEED_DATA: ❌ Invalid JSON in ${key}, removing:`, parseError);
        localStorage.removeItem(key);
        log(`🔧 Removed corrupted ${key} from storage`);
      }
    }

    log("✅ Storage format validation completed");
    
  } catch (error) {
    console.error(`[${timestamp()}] SEED_DATA: ❌ Storage validation failed:`, error);
    console.error(`[${timestamp()}] SEED_DATA: Error details:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Create seed data if needed
 */
export function createSeedData(includeDemoData: boolean = false): void {
  log("===== SEED DATA CREATION STARTED =====");
  log(`Creating seed data with demo data: ${includeDemoData}`);
  
  try {
    log("Checking if seed data already exists...");
    
    // Check if we already have essential data
    const existingOrgs = localStorage.getItem('organizations');
    const existingUsers = localStorage.getItem('currentUser');
    
    if (existingOrgs && existingUsers) {
      log("✅ Seed data already exists, skipping creation");
      return;
    }

    log("Creating default organization...");
    
    // Create default organization - removed settings property
    const defaultOrg: Organization = {
      id: uuidv4(),
      name: 'Default Organization',
      ownerId: 'system'
    };

    log("Creating default work schedule...");
    
    // Create default work schedule - fixed rdoDays to use numeric keys
    const defaultSchedule: WorkSchedule = {
      id: 'default-schedule',
      name: 'Default Schedule',
      userId: 'system',
      weeks: {
        1: {
          monday: { startTime: '09:00', endTime: '17:00' },
          tuesday: { startTime: '09:00', endTime: '17:00' },
          wednesday: { startTime: '09:00', endTime: '17:00' },
          thursday: { startTime: '09:00', endTime: '17:00' },
          friday: { startTime: '09:00', endTime: '17:00' },
          saturday: null,
          sunday: null
        },
        2: {
          monday: { startTime: '09:00', endTime: '17:00' },
          tuesday: { startTime: '09:00', endTime: '17:00' },
          wednesday: { startTime: '09:00', endTime: '17:00' },
          thursday: { startTime: '09:00', endTime: '17:00' },
          friday: { startTime: '09:00', endTime: '17:00' },
          saturday: null,
          sunday: null
        }
      },
      rdoDays: {
        1: [],
        2: []
      }
    };

    log("Storing default data to localStorage...");
    
    // Store the default data
    try {
      localStorage.setItem('organizations', JSON.stringify([defaultOrg]));
      log("✅ Default organization stored");
      
      localStorage.setItem('work-schedules', JSON.stringify([defaultSchedule]));
      log("✅ Default work schedule stored");
      
      // Initialize empty arrays for other data
      localStorage.setItem('users', JSON.stringify([]));
      localStorage.setItem('teams', JSON.stringify([]));
      localStorage.setItem('teamMemberships', JSON.stringify([]));
      log("✅ Empty data arrays initialized");
      
    } catch (storageError) {
      console.error(`[${timestamp()}] SEED_DATA: ❌ Failed to store seed data:`, storageError);
      throw new Error(`Failed to store seed data: ${storageError}`);
    }

    // Only create demo data if explicitly requested
    if (includeDemoData) {
      log("Creating demo data...");
      createDemoData(defaultOrg, defaultSchedule);
    } else {
      log("Skipping demo data creation");
    }

    log("✅ Seed data creation completed successfully");
    
  } catch (error) {
    console.error(`[${timestamp()}] SEED_DATA: ❌ Seed data creation failed:`, error);
    console.error(`[${timestamp()}] SEED_DATA: Error details:`, error instanceof Error ? error.message : String(error));
    console.error(`[${timestamp()}] SEED_DATA: Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

/**
 * Create demo data (only called when explicitly requested)
 */
function createDemoData(defaultOrg: Organization, defaultSchedule: WorkSchedule): void {
  log("===== CREATING DEMO DATA =====");
  
  try {
    // This function intentionally left minimal
    // We don't want to create demo users/data by default
    log("Demo data creation skipped - no demo data configured");
    
  } catch (error) {
    console.error(`[${timestamp()}] SEED_DATA: ❌ Demo data creation failed:`, error);
    throw error;
  }
}
