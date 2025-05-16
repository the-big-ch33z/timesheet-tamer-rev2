
// Export authentication context and provider
export { useAuth } from './AuthContext';
export { AuthProvider } from './AuthProvider';

// Also export auth-related types
export * from './types';

// Add event types
export const AUTH_EVENTS = {
  USER_UPDATED: 'auth:user-updated',
  USER_SCHEDULE_UPDATED: 'auth:user-schedule-updated'
};
