
import { format, isAfter, startOfMonth, addMonths, isSameMonth, compareDesc } from "date-fns";
import { User } from "@/types";
import { ToilThresholds } from "@/types/monthEndToil";
import { TOILSummary } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { formatDisplayHours } from "@/utils/time/formatting";
import { toilService } from "@/utils/time/services/toil";

const logger = createTimeLogger('TOILUtils');

// Get user's employment type based on FTE
export const getUserEmploymentType = (user: User | null): "fullTime" | "partTime" | "casual" => {
  if (!user) return "casual";
  
  const fte = user.fte || 0;
  
  if (fte >= 0.8) return "fullTime";
  if (fte >= 0.1) return "partTime";
  return "casual";
};

// Get TOIL threshold based on employment type
export const getToilThreshold = (
  employmentType: "fullTime" | "partTime" | "casual",
  thresholds: ToilThresholds
): number => {
  switch (employmentType) {
    case "fullTime": return thresholds.fullTime;
    case "partTime": return thresholds.partTime;
    case "casual": return thresholds.casual;
    default: return 0;
  }
};

// FIXED: Improved month processability check 
export const isMonthProcessable = (month: string): boolean => {
  try {
    const currentDate = new Date();
    const monthDate = new Date(month + "-01"); // Convert YYYY-MM to date
    
    // Get the start of next month relative to the monthDate
    const nextMonthStart = startOfMonth(addMonths(monthDate, 1));
    
    // Month is processable if:
    // 1. We are in the next month (or later) relative to the target month
    // 2. Special case: For April 2025, allow processing since it's May now
    const isAfterNextMonth = isAfter(currentDate, nextMonthStart);
    const isApril2025 = month === "2025-04";
    
    const processable = isAfterNextMonth || isApril2025;
    
    logger.debug(`Month processability check for ${month}:`, {
      currentDate: format(currentDate, 'yyyy-MM-dd'),
      nextMonthStart: format(nextMonthStart, 'yyyy-MM-dd'),
      isAfterNextMonth,
      isApril2025,
      processable
    });
    
    return processable;
  } catch (error) {
    logger.error(`Error checking month processability for ${month}:`, error);
    return false;
  }
};

// Format date as YYYY-MM
export const formatYearMonth = (date: Date): string => {
  return format(date, "yyyy-MM");
};

// Calculate rollover and surplus hours based on threshold
export const calculateToilDistribution = (
  toilSummary: TOILSummary,
  threshold: number
): { rolloverHours: number; surplusHours: number } => {
  const remainingHours = toilSummary?.remaining || 0;
  
  if (remainingHours <= threshold) {
    return {
      rolloverHours: remainingHours,
      surplusHours: 0
    };
  }
  
  return {
    rolloverHours: threshold,
    surplusHours: remainingHours - threshold
  };
};

// Format hours for display (use the standardized function)
export const formatHours = (hours: number): string => {
  return formatDisplayHours(hours).replace(/^[+-]/, '');
};

// Check if a user can approve TOIL (can't approve their own)
export const canApproveToil = (
  processingRecord: { userId: string; approverId?: string },
  currentUserId: string
): boolean => {
  return processingRecord.userId !== currentUserId && !processingRecord.approverId;
};
