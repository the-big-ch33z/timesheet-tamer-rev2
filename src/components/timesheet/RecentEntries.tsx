
import React from "react";
import { Card } from "@/components/ui/card";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context/TimeEntryContext";
import { isAfter } from "date-fns";

const RecentEntries = () => {
  const { entries } = useTimeEntryContext();

  // Sort entries by date (most recent first)
  const sortedEntries = React.useMemo(() => {
    const entriesToSort = [...entries];
    return entriesToSort.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return isAfter(dateA, dateB) ? -1 : 1;
    });
  }, [entries]);

  if (sortedEntries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent time entries found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedEntries.slice(0, 10).map((entry) => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        
        return (
          <Card key={entry.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">
                  {entryDate.toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {entry.startTime} - {entry.endTime}
                </div>
                {entry.project && (
                  <div className="text-xs text-gray-400 mt-1">
                    Project: {entry.project}
                  </div>
                )}
              </div>
              <div className="text-lg font-bold">
                {entry.hours.toFixed(1)} hrs
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default RecentEntries;
