
/**
 * TOIL Service Implementation
 * This file provides functionality for Time Off In Lieu tracking
 */

import { TOILService } from "./service";

// Export the TOIL job number constant
export const TOIL_JOB_NUMBER = "TOIL";

// Create and export a singleton instance
export const toilService = new TOILService();

// Re-export the service class for tests and advanced usage
export { TOILService };
