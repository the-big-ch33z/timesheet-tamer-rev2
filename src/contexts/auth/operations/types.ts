
import { UserRole } from '@/types';

// Define the user metrics type
export interface UserMetrics {
  fte?: number;
  fortnightHours?: number;
}

// Export operation types
export type UserOperationResult = Promise<void>;
