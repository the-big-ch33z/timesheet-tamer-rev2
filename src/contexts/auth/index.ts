
// Re-export types from the types file
export type { 
  AuthContextType, 
  LoginCredentials, 
  SignupCredentials,
  UserMetrics 
} from './types';

// Export the context provider
export { AuthProvider } from './AuthProvider';

// Export the useAuth hook
export { useAuth } from './AuthProvider';
