
import { TimeEntry } from "@/types";
import { timeEntryService, createTimeEntryService } from "./time-entry-service";
import { createTimeLogger } from "../errors/timeLogger";

// Enhanced logging for service initialization
const timestamp = () => new Date().toISOString();
const log = (message: string, data?: any) => {
  console.log(`[${timestamp()}] SERVICE_INIT: ${message}`, data || '');
};

const logger = createTimeLogger('api-wrapper');

// Service initialization state
let isInitialized = false;
let initializationError: Error | null = null;
let serviceInstance: any = null;

/**
 * Initialize the time entry service
 */
export async function initializeService(): Promise<void> {
  log("===== SERVICE INITIALIZATION STARTED =====");
  
  if (isInitialized) {
    log("✅ Service already initialized, skipping");
    return;
  }

  try {
    log("Checking browser environment...");
    
    if (typeof window === 'undefined') {
      throw new Error('Service can only be initialized in browser environment');
    }
    log("✅ Browser environment confirmed");

    log("Checking localStorage availability...");
    try {
      localStorage.setItem('test-key', 'test-value');
      localStorage.removeItem('test-key');
      log("✅ LocalStorage is available and functional");
    } catch (storageError) {
      console.error(`[${timestamp()}] SERVICE_INIT: ❌ LocalStorage test failed:`, storageError);
      throw new Error(`LocalStorage not available: ${storageError}`);
    }

    log("Initializing time entry service...");
    
    // Check if service instance exists
    if (!serviceInstance) {
      log("Creating new service instance...");
      serviceInstance = timeEntryService;
      
      // Ensure the service is properly initialized
      if (typeof serviceInstance.init === 'function') {
        log("Calling service.init()...");
        serviceInstance.init();
        log("✅ Service.init() completed");
      } else {
        log("⚠️ Service.init() method not found, service may already be initialized");
      }
    } else {
      log("✅ Service instance already exists");
    }

    log("Validating service functionality...");
    
    // Test basic service operations
    try {
      const testEntries = serviceInstance.getAllEntries();
      log(`✅ Service getAllEntries() test successful, found ${testEntries.length} entries`);
    } catch (serviceError) {
      console.error(`[${timestamp()}] SERVICE_INIT: ❌ Service functionality test failed:`, serviceError);
      throw new Error(`Service functionality test failed: ${serviceError}`);
    }

    isInitialized = true;
    initializationError = null;
    log("✅ Service initialization completed successfully");
    
  } catch (error) {
    console.error(`[${timestamp()}] SERVICE_INIT: ❌ Service initialization failed:`, error);
    console.error(`[${timestamp()}] SERVICE_INIT: Error details:`, error instanceof Error ? error.message : String(error));
    console.error(`[${timestamp()}] SERVICE_INIT: Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
    
    initializationError = error instanceof Error ? error : new Error(String(error));
    isInitialized = false;
    
    // Re-throw the error so calling code knows initialization failed
    throw initializationError;
  }
}

/**
 * Check if services are initialized
 */
export function areServicesInitialized(): boolean {
  const result = isInitialized && initializationError === null;
  log(`Service initialization status check: ${result}`);
  return result;
}

/**
 * Get initialization error if any
 */
export function getInitializationError(): Error | null {
  if (initializationError) {
    log(`Returning initialization error: ${initializationError.message}`);
  }
  return initializationError;
}

/**
 * Get the service instance
 */
export function getServiceInstance() {
  log("Getting service instance...");
  if (!isInitialized) {
    log("⚠️ Service not initialized, returning null");
    return null;
  }
  log("✅ Returning initialized service instance");
  return serviceInstance;
}

/**
 * Force reinitialize the service (for error recovery)
 */
export async function reinitializeService(): Promise<void> {
  log("===== FORCE REINITIALIZING SERVICE =====");
  
  isInitialized = false;
  initializationError = null;
  serviceInstance = null;
  
  await initializeService();
}

// Legacy API compatibility - these functions delegate to the service
export function getAllEntries(): TimeEntry[] {
  log("Legacy getAllEntries() called");
  try {
    if (!areServicesInitialized()) {
      log("⚠️ Service not initialized for getAllEntries()");
      return [];
    }
    
    const entries = serviceInstance.getAllEntries();
    log(`✅ Legacy getAllEntries() returning ${entries.length} entries`);
    return entries;
  } catch (error) {
    console.error(`[${timestamp()}] SERVICE_INIT: ❌ Legacy getAllEntries() failed:`, error);
    return [];
  }
}

export function getUserEntries(userId: string): TimeEntry[] {
  log(`Legacy getUserEntries() called for user: ${userId}`);
  try {
    if (!areServicesInitialized()) {
      log("⚠️ Service not initialized for getUserEntries()");
      return [];
    }
    
    const entries = serviceInstance.getUserEntries(userId);
    log(`✅ Legacy getUserEntries() returning ${entries.length} entries for user ${userId}`);
    return entries;
  } catch (error) {
    console.error(`[${timestamp()}] SERVICE_INIT: ❌ Legacy getUserEntries() failed:`, error);
    return [];
  }
}

export function getDayEntries(date: Date, userId: string): TimeEntry[] {
  log(`Legacy getDayEntries() called for date: ${date.toISOString()}, user: ${userId}`);
  try {
    if (!areServicesInitialized()) {
      log("⚠️ Service not initialized for getDayEntries()");
      return [];
    }
    
    const entries = serviceInstance.getDayEntries(date, userId);
    log(`✅ Legacy getDayEntries() returning ${entries.length} entries`);
    return entries;
  } catch (error) {
    console.error(`[${timestamp()}] SERVICE_INIT: ❌ Legacy getDayEntries() failed:`, error);
    return [];
  }
}

export function getMonthEntries(date: Date, userId: string): TimeEntry[] {
  log(`Legacy getMonthEntries() called for date: ${date.toISOString()}, user: ${userId}`);
  try {
    if (!areServicesInitialized()) {
      log("⚠️ Service not initialized for getMonthEntries()");
      return [];
    }
    
    const entries = serviceInstance.getMonthEntries(date, userId);
    log(`✅ Legacy getMonthEntries() returning ${entries.length} entries`);
    return entries;
  } catch (error) {
    console.error(`[${timestamp()}] SERVICE_INIT: ❌ Legacy getMonthEntries() failed:`, error);
    return [];
  }
}

// Export the service instance for direct access
export { timeEntryService };
