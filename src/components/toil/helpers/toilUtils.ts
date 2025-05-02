
import { format, isAfter, startOfMonth, addMonths } from "date-fns";
import { User } from "@/types";
import { ToilThresholds } from "@/types/monthEndToil";
import { TOILSummary } from "@/types/toil";

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

// Check if a month is ready for month-end processing
export const isMonthProcessable = (month: string): boolean => {
  const currentDate = new Date();
  const monthDate = new Date(month + "-01"); // Convert YYYY-MM to date
  const nextMonthStart = startOfMonth(addMonths(monthDate, 1));
  
  // Month is processable if we are in or past the next month
  return isAfter(currentDate, nextMonthStart);
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

// Format hours for display with 1 decimal place
export const formatHours = (hours: number): string => {
  return hours.toFixed(1);
};

// Check if a user can approve TOIL (can't approve their own)
export const canApproveToil = (
  processingRecord: { userId: string; approverId?: string },
  currentUserId: string
): boolean => {
  return processingRecord.userId !== currentUserId && !processingRecord.approverId;
};
