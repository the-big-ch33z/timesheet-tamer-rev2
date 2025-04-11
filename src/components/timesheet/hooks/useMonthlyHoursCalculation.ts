
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
  
  logger.debug("User metrics retrieved:", { 
    userId: user?.id, 
    metrics: userMetrics 
  });
  
  // If we have a work schedule, calculate fortnight hours from it
  let fortnightHours = userMetrics?.fortnightHours || 0;
  let userFte = userMetrics?.fte || 1.0;
  
  if (workSchedule) {
    // Calculate fortnight hours based on the schedule
    const scheduleHours = calculateFortnightHoursFromSchedule(workSchedule);
    
    // Use calculated hours from schedule if available
    if (scheduleHours > 0) {
      // Apply FTE to the schedule hours if user has an FTE set
      if (userFte !== 1.0 && userFte > 0) {
        fortnightHours = scheduleHours * userFte;
        logger.debug(`Adjusted fortnight hours by FTE: ${scheduleHours} * ${userFte} = ${fortnightHours}`);
      } else {
        fortnightHours = scheduleHours;
        logger.debug(`Using calculated fortnight hours from schedule: ${fortnightHours}`);
      }
    }
  } else if (userMetrics) {
    // If no schedule but we have user metrics with fortnightHours
    fortnightHours = userMetrics.fortnightHours;
    logger.debug(`Using fortnight hours from user metrics: ${fortnightHours}`);
  }
  
  logger.debug(`Final fortnight hours value: ${fortnightHours}`, { 
    userId: user?.id,
    fte: userFte,
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
