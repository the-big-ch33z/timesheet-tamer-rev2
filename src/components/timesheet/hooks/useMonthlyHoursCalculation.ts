
import { User, TimeEntry } from "@/types";
import { calculateMonthlyTargetHours } from "@/lib/date-utils";
import { useUserMetrics } from "@/contexts/user-metrics";
import { useLogger } from "@/hooks/useLogger";

export const useMonthlyHoursCalculation = (
  entries: TimeEntry[],
  currentMonth: Date,
  user?: User
) => {
  const { getUserMetrics } = useUserMetrics();
  const logger = useLogger("MonthlyHoursCalculation");
  
  // Calculate total hours logged for the month
  const hours = entries.reduce((total, entry) => total + entry.hours, 0);
  
  // Get user metrics with defaults if user is provided
  const userMetrics = user ? getUserMetrics(user.id) : null;
  const fortnightHours = userMetrics?.fortnightHours || 0;
  
  logger.debug(`Using fortnight hours value: ${fortnightHours}`, { userId: user?.id });
  
  const targetHours = calculateMonthlyTargetHours(fortnightHours, currentMonth);
  logger.debug(`Calculated monthly target hours: ${targetHours}`, { 
    fortnightHours,
    month: currentMonth.toISOString().substring(0, 7)
  });
  
  // Calculate completion percentage
  const percentage = Math.min(Math.round((hours / targetHours) * 100), 100);
  
  // Hours remaining to meet target
  const hoursRemaining = targetHours - hours > 0 ? (targetHours - hours).toFixed(1) : 0;
  
  // Determine color based on percentage
  const getProgressColor = () => {
    if (percentage >= 100) return "success";
    if (percentage >= 70) return "info";
    if (percentage >= 30) return "warning";
    return "danger";
  };

  return {
    hours,
    targetHours,
    percentage,
    hoursRemaining,
    progressColor: getProgressColor()
  };
};
