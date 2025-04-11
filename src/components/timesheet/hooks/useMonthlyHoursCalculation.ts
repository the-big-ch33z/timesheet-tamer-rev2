
import { User, TimeEntry, WorkSchedule } from "@/types";
import { calculateMonthlyTargetHours } from "@/lib/date-utils";
import { useUserMetrics } from "@/contexts/user-metrics";
import { useLogger } from "@/hooks/useLogger";
import { calculateFortnightHoursFromSchedule } from "../utils/scheduleUtils";

export const useMonthlyHoursCalculation = (
  entries: TimeEntry[],
  currentMonth: Date,
  user?: User,
  workSchedule?: WorkSchedule
) => {
  const { getUserMetrics } = useUserMetrics();
  const logger = useLogger("MonthlyHoursCalculation");
  
  // Calculate total hours logged for the month
  const hours = entries.reduce((total, entry) => total + entry.hours, 0);
  
  // Get user metrics with defaults if user is provided
  const userMetrics = user ? getUserMetrics(user.id) : null;
  
  // If we have a work schedule, calculate fortnight hours from it
  let fortnightHours = userMetrics?.fortnightHours || 0;
  
  if (workSchedule) {
    // Calculate fortnight hours based on the schedule
    const scheduleHours = calculateFortnightHoursFromSchedule(workSchedule);
    
    // Use calculated hours from schedule if available
    if (scheduleHours > 0) {
      fortnightHours = scheduleHours;
      logger.debug(`Using calculated fortnight hours from schedule: ${fortnightHours}`, { 
        scheduleId: workSchedule.id,
        scheduleName: workSchedule.name
      });
    }
  }
  
  logger.debug(`Using fortnight hours value: ${fortnightHours}`, { 
    userId: user?.id,
    fromSchedule: !!workSchedule
  });
  
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
