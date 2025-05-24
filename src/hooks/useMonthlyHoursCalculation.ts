
import { useMemo } from 'react';
import { User, TimeEntry, WorkSchedule } from "@/types";
import { calculateMonthlyTargetHours } from "@/utils/time/calculations/hoursCalculations";
import { useUserMetrics } from "@/contexts/user-metrics";
import { useLogger } from "@/hooks/useLogger";
import { calculateFortnightHoursFromSchedule } from '@/utils/time/scheduleUtils';

export interface MonthlyHoursCalculationOptions {
  entries: TimeEntry[];
  currentMonth: Date;
  user?: User;
  workSchedule?: WorkSchedule;
}

/**
 * Hook to calculate monthly hours and completion percentage.
 * Now uses options-based interface for consistency.
 */
export const useMonthlyHoursCalculation = (options: MonthlyHoursCalculationOptions) => {
  const { entries, currentMonth, user, workSchedule } = options;
  const { getUserMetrics } = useUserMetrics();
  const logger = useLogger("MonthlyHoursCalculation");
  
  // Get user metrics
  const userMetrics = useMemo(() => (
    user ? getUserMetrics(user.id) : null
  ), [user, getUserMetrics]);

  // Calculate total hours from passed entries for the current month
  const hours = useMemo(() => {
    if (!entries?.length) return 0;
    
    // Filter entries for the current month only
    const monthEntries = entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.getMonth() === currentMonth.getMonth() && 
             entryDate.getFullYear() === currentMonth.getFullYear();
    });
    
    logger.debug(`Calculating total hours for ${monthEntries.length} entries in month ${currentMonth.toISOString().slice(0, 7)}`);
    
    // Sum up the hours
    return monthEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
  }, [entries, currentMonth, logger]);

  // Calculate fortnight hours and target hours
  const { fortnightHours, targetHours } = useMemo(() => {
    // If we have a work schedule, calculate fortnight hours from it
    let fortnightHours = userMetrics?.fortnightHours || 76; // Default to 76 hours if no metrics
    let userFte = userMetrics?.fte || 1.0;
    
    if (workSchedule) {
      // Calculate adjusted fortnight hours based on schedule and FTE
      fortnightHours = calculateFortnightHoursFromSchedule(workSchedule) * userFte;
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
    
    // Pass workSchedule to properly account for RDO days in target hours
    const targetHours = calculateMonthlyTargetHours(fortnightHours, currentMonth, workSchedule);
    logger.debug(`Calculated monthly target hours: ${targetHours}`, { 
      fortnightHours,
      month: currentMonth.toISOString().substring(0, 7),
      hasWorkSchedule: !!workSchedule
    });
    
    return { fortnightHours, targetHours };
  }, [workSchedule, userMetrics, currentMonth, logger, user]);

  // Calculate completion percentage and remaining hours
  const percentage = useMemo(() => 
    Math.min(Math.round((hours / targetHours) * 100), 100),
    [hours, targetHours]
  );

  const hoursRemaining = useMemo(() => {
    const remaining = targetHours - hours;
    return remaining > 0 ? Number(remaining.toFixed(1)) : 0;
  }, [targetHours, hours]);

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
