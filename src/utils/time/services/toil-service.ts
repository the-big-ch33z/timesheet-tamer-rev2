
/**
 * TOIL (Time Off In Lieu) Service
 * This file provides TOIL-related functionality.
 */

import { TOILService, TOIL_JOB_NUMBER } from "./toil/service";

// Export for easy access
export { TOIL_JOB_NUMBER } from "./toil/service";

// Create and export singleton instance
export const toilService = new TOILService();

// Initialize if in browser
if (typeof window !== 'undefined') {
  toilService.init();
}
