
import { useMemo } from 'react';
import { User, TimeEntry, WorkSchedule } from "@/types";
import { calculateMonthlyTargetHours } from "@/lib/date-utils";
import { useUserMetrics } from "@/contexts/user-metrics";
import { useLogger } from "@/hooks/useLogger";
import { calculateAdjustedFortnightHours } from "@/utils/time/calculations";

export const useMonthlyHoursCalculation = (
  entries: TimeEntry[],
  currentMonth: Date,
  user?: User,
  workSchedule?: WorkSchedule
) => {
  const { getUserMetrics } = useUserMetrics();
  const logger = useLogger("MonthlyHoursCalculation");
  
  // Use useMemo to optimize calculations
  const userMetrics = useMemo(() => (
    user ? getUserMetrics(user.id) : null
  ), [user, getUserMetrics]);
  
  logger.debug("User metrics retrieved:", { 
    userId: user?.id, 
    metrics: userMetrics 
  });
  
  // Memoize total hours calculation
  const hours = useMemo(() => 
    entries.reduce((total, entry) => total + entry.hours, 0), 
    [entries]
  );
  
  // Calculate fortnight hours and target hours
  const { fortnightHours, targetHours } = useMemo(() => {
    // If we have a work schedule, calculate fortnight hours from it
    let fortnightHours = userMetrics?.fortnightHours || 0;
    let userFte = userMetrics?.fte || 1.0;
    
    if (workSchedule) {
      // Calculate adjusted fortnight hours based on schedule and FTE
      fortnightHours = calculateAdjustedFortnightHours(workSchedule, userFte);
      logger.debug(`Using calculated fortnight hours from schedule: ${fortnightHours}`);
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
    
    return { fortnightHours, targetHours };
  }, [workSchedule, userMetrics, currentMonth, logger, user]);
  
  // Calculate completion percentage and remaining hours
  const percentage = useMemo(() => 
    Math.min(Math.round((hours / targetHours) * 100), 100),
    [hours, targetHours]
  );
  
  const hoursRemaining = useMemo(() =>
    targetHours - hours > 0 ? (targetHours - hours).toFixed(1) : "0",
    [targetHours, hours]
  );
  
  // Determine color based on percentage
  const progressColor = useMemo(() => {
    if (percentage >= 100) return "success";
    if (percentage >= 70) return "info";
    if (percentage >= 30) return "warning";
    return "danger";
  }, [percentage]);

  return {
    hours,
    targetHours,
    percentage,
    hoursRemaining,
    progressColor
  };
};
