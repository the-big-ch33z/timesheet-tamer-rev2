
import { UserRole } from '@/types';

// Define the user metrics type
export interface UserMetrics {
  fte?: number;
  fortnightHours?: number;
  workScheduleId?: string;
}

// Export operation types
export type UserOperationResult = Promise<void>;
