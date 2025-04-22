import { WorkSchedule } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { resolveRDOConflicts } from "@/utils/time/rdoUtils";
import { getHolidays } from "@/lib/holidays";
import { createTimeLogger } from "@/utils/time/errors";

// Define ToastType for compatibility
type ToastType = ReturnType<typeof useToast>["toast"];

const logger = createTimeLogger('scheduleOperations');

export const createScheduleOperations = (
  state: any,
  setState: any,
  toast: ToastType
) => {
  const updateSchedule = (scheduleId: string, updates: Partial<WorkSchedule>) => {
    // Check for holiday conflicts
    const holidays = getHolidays();
    const { schedule: resolvedSchedule, movements } = resolveRDOConflicts(
      { ...state.schedules.find((s: WorkSchedule) => s.id === scheduleId), ...updates },
      holidays
    );

    // Update the schedule with resolved RDOs
    setState((prev: any) => ({
      ...prev,
      schedules: prev.schedules.map((s: WorkSchedule) =>
        s.id === scheduleId ? resolvedSchedule : s
      )
    }));

    // Notify about any RDO movements
    if (movements.length > 0) {
      movements.forEach(move => {
        toast({
          title: "RDO Automatically Moved",
          description: `RDO moved from ${move.fromDay} to ${move.toDay} due to public holiday`,
        });
        logger.debug(`RDO moved: ${JSON.stringify(move)}`);
      });
    }
  };

  const updateDefaultSchedule = (updates: Partial<WorkSchedule>) => {
    // Check for holiday conflicts
    const holidays = getHolidays();
    const { schedule: resolvedSchedule, movements } = resolveRDOConflicts(
      { ...state.defaultSchedule, ...updates },
      holidays
    );

    // Update the default schedule with resolved RDOs
    setState((prev: any) => ({
      ...prev,
      defaultSchedule: resolvedSchedule
    }));

    // Notify about any RDO movements
    if (movements.length > 0) {
      movements.forEach(move => {
        toast({
          title: "RDO Automatically Moved",
          description: `RDO moved from ${move.fromDay} to ${move.toDay} due to public holiday`,
        });
        logger.debug(`RDO moved: ${JSON.stringify(move)}`);
      });
    }
  };

  const createSchedule = (newSchedule: WorkSchedule) => {
    // Check for holiday conflicts
    const holidays = getHolidays();
    const { schedule: resolvedSchedule, movements } = resolveRDOConflicts(
      newSchedule,
      holidays
    );

    setState((prev: any) => ({
      ...prev,
      schedules: [...prev.schedules, resolvedSchedule]
    }));

    // Notify about any RDO movements
    if (movements.length > 0) {
      movements.forEach(move => {
        toast({
          title: "RDO Automatically Moved",
          description: `RDO moved from ${move.fromDay} to ${move.toDay} due to public holiday`,
        });
        logger.debug(`RDO moved: ${JSON.stringify(move)}`);
      });
    }
  };

  const getScheduleById = (scheduleId: string): WorkSchedule | undefined => {
    return state.schedules.find((s: WorkSchedule) => s.id === scheduleId);
  };

  const getAllSchedules = (): WorkSchedule[] => {
    return [...state.schedules];
  };

  return {
    updateDefaultSchedule,
    createSchedule,
    updateSchedule,
    getScheduleById,
    getAllSchedules
  };
};
