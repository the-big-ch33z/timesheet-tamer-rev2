
import React, { createContext, useContext } from "react";
import { UserMetrics, UserMetricsContextType, DEFAULT_USER_METRICS } from "./types";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";

// Create the context with a default implementation
const UserMetricsContext = createContext<UserMetricsContextType>({
  getUserMetrics: () => DEFAULT_USER_METRICS,
  updateUserMetrics: async () => {},
  resetUserMetrics: async () => {}
});

export const UserMetricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users, updateUserMetrics: authUpdateUserMetrics } = useAuth();
  const { toast } = useToast();

  // Get user metrics with defaults for missing values
  const getUserMetrics = (userId: string): UserMetrics => {
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      console.log(`User ${userId} not found, returning default metrics`);
      return DEFAULT_USER_METRICS;
    }
    
    return {
      fte: user.fte !== undefined ? user.fte : DEFAULT_USER_METRICS.fte,
      fortnightHours: user.fortnightHours !== undefined ? user.fortnightHours : DEFAULT_USER_METRICS.fortnightHours,
      workScheduleId: user.workScheduleId || DEFAULT_USER_METRICS.workScheduleId
    };
  };

  // Update user metrics with validation
  const updateUserMetrics = async (userId: string, metrics: Partial<UserMetrics>): Promise<void> => {
    try {
      // Validate metrics before updating
      const validatedMetrics: Partial<UserMetrics> = {};
      
      if (metrics.fte !== undefined) {
        validatedMetrics.fte = Number.isFinite(metrics.fte) ? metrics.fte : DEFAULT_USER_METRICS.fte;
      }
      
      if (metrics.fortnightHours !== undefined) {
        validatedMetrics.fortnightHours = Number.isFinite(metrics.fortnightHours) 
          ? metrics.fortnightHours 
          : DEFAULT_USER_METRICS.fortnightHours;
      }
      
      if (metrics.workScheduleId !== undefined) {
        validatedMetrics.workScheduleId = metrics.workScheduleId;
      }
      
      await authUpdateUserMetrics(userId, validatedMetrics);
      console.log(`Updated user ${userId} metrics:`, validatedMetrics);
      
    } catch (error) {
      console.error("Error updating user metrics:", error);
      toast({
        title: "Failed to update metrics",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Reset user metrics to defaults
  const resetUserMetrics = async (userId: string): Promise<void> => {
    try {
      await authUpdateUserMetrics(userId, DEFAULT_USER_METRICS);
      console.log(`Reset user ${userId} metrics to defaults`);
      
      toast({
        title: "Metrics reset",
        description: "User metrics have been reset to default values",
      });
    } catch (error) {
      console.error("Error resetting user metrics:", error);
      toast({
        title: "Failed to reset metrics",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value: UserMetricsContextType = {
    getUserMetrics,
    updateUserMetrics,
    resetUserMetrics
  };

  return (
    <UserMetricsContext.Provider value={value}>
      {children}
    </UserMetricsContext.Provider>
  );
};

// Hook for using the context
export const useUserMetrics = () => useContext(UserMetricsContext);
