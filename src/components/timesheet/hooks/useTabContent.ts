
import { TimeEntry, WorkSchedule, User } from "@/types";

export interface TabContentProps {
  entries: TimeEntry[];
  currentMonth: Date;
  user?: User;
  workSchedule?: WorkSchedule;
}

export const useTabContent = ({ entries }: TabContentProps) => {
  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return {
    sortedEntries
  };
};
