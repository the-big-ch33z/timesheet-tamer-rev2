
import { useState, useEffect } from "react";
import { useUserMetrics } from "@/contexts/user-metrics";
import { UserMetrics, DEFAULT_USER_METRICS } from "@/contexts/user-metrics/types";
import { useToast } from "@/hooks/use-toast";

interface UseMetricsFormOptions {
  userId: string;
  onSuccess?: () => void;
}

export const useMetricsForm = ({ userId, onSuccess }: UseMetricsFormOptions) => {
  const { getUserMetrics, updateUserMetrics } = useUserMetrics();
  const { toast } = useToast();
  
  // Local form state
  const [formValues, setFormValues] = useState<UserMetrics>(DEFAULT_USER_METRICS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (userId) {
      const metrics = getUserMetrics(userId);
      setFormValues(metrics);
      console.log(`Initialized metrics form for user ${userId} with:`, metrics);
    }
  }, [userId, getUserMetrics]);

  // Form field change handlers
  const handleFteChange = (value: number) => {
    // Ensure FTE is between 0 and 1
    const fte = Math.max(0, Math.min(1, value));
    setFormValues(prev => ({ ...prev, fte }));
  };

  const handleFortnightHoursChange = (value: number) => {
    // Ensure fortnightHours is non-negative
    const fortnightHours = Math.max(0, value);
    setFormValues(prev => ({ ...prev, fortnightHours }));
  };

  const handleWorkScheduleChange = (workScheduleId: string) => {
    setFormValues(prev => ({ ...prev, workScheduleId }));
  };

  // Form submission handler
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await updateUserMetrics(userId, formValues);
      
      toast({
        title: "Metrics updated",
        description: "User metrics have been updated successfully",
        className: "bg-green-50 border-green-200"
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    formValues,
    isLoading,
    error,
    handleFteChange,
    handleFortnightHoursChange,
    handleWorkScheduleChange,
    handleSubmit
  };
};
