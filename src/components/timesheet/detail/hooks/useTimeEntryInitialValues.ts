
import { useMemo } from "react";
import { WorkSchedule } from "@/types";

interface UseTimeEntryInitialValuesProps {
  date: Date;
  workSchedule?: WorkSchedule;
}

export const useTimeEntryInitialValues = ({
  workSchedule
}: UseTimeEntryInitialValuesProps) => {
  return useMemo(() => ({ workSchedule }), [workSchedule]);
};
