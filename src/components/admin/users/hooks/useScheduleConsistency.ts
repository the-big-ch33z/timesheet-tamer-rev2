
import { useEffect } from "react";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { useToast } from "@/hooks/use-toast";

export const useScheduleConsistency = () => {
  const { toast } = useToast();
  const { verifyUserScheduleConsistency } = useWorkSchedule();

  // Check for data consistency on component mount
  useEffect(() => {
    const result = verifyUserScheduleConsistency();
    if (!result.consistent) {
      console.warn("User schedule inconsistencies detected:", result.issues);
      
      if (process.env.NODE_ENV === 'development') {
        // Only show this in development
        toast({
          title: "Schedule inconsistencies detected",
          description: `${result.issues.length} issues found. See console for details.`,
          variant: "destructive"
        });
      }
    }
  }, []);

  return null; // No state needed to return here
};
