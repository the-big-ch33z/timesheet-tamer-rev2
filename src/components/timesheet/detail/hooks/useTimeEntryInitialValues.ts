
import { useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";

interface UseTimeEntryInitialValuesProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
}

export const useTimeEntryInitialValues = ({
  workSchedule
}: UseTimeEntryInitialValuesProps) => {
  return useMemo(() => ({ workSchedule }), [workSchedule]);
};
