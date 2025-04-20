
import React, { useEffect } from "react";
import { TimeEntry } from "@/types";
import EntryList from "./EntryList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('ExistingEntriesList');

interface ExistingEntriesListProps {
  entries: TimeEntry[];
  date: Date;
  interactive?: boolean;
  onDeleteEntry: (entryId: string) => Promise<boolean>;
}

const ExistingEntriesList: React.FC<ExistingEntriesListProps> = ({
  entries,
  date,
  interactive = true,
  onDeleteEntry
}) => {
  // Add debugging effect to track entries for this component
  useEffect(() => {
    logger.debug(`ExistingEntriesList for ${format(date, 'yyyy-MM-dd')}: ${entries.length} entries received`);
    if (entries.length > 0) {
      logger.debug('First entry:', {
        id: entries[0].id,
        date: entries[0].date instanceof Date 
          ? entries[0].date.toISOString() 
          : entries[0].date,
        hours: entries[0].hours,
        userId: entries[0].userId
      });
    } else {
      logger.debug('No entries received for this date');
    }
  }, [entries, date]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Time Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <EntryList 
          entries={entries}
          interactive={interactive}
          onDeleteEntry={onDeleteEntry}
        />
      </CardContent>
    </Card>
  );
};

export default ExistingEntriesList;
