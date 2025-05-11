import React, { useEffect } from "react";
import { TimeEntry } from "@/types";
import EntryList from "./EntryList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { createTimeLogger } from "@/utils/time/errors";
import { TOIL_JOB_NUMBER } from "@/utils/time/services/toil/toilService"; // Fixed import path

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
        date: entries[0].date instanceof Date ? entries[0].date.toISOString() : entries[0].date,
        hours: entries[0].hours,
        userId: entries[0].userId
      });
      
      // Log if there are any TOIL entries
      const toilEntries = entries.filter(entry => entry.jobNumber === TOIL_JOB_NUMBER);
      if (toilEntries.length > 0) {
        logger.debug(`Found ${toilEntries.length} TOIL usage entries`);
      }
    } else {
      logger.debug('No entries received for this date');
    }
  }, [entries, date]);
  
  return <div>
      {entries.length > 0 ? <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {entries.some(e => e.jobNumber === TOIL_JOB_NUMBER) && 
                <span className="text-amber-600 text-sm font-normal mb-1 block">
                  Includes TOIL usage
                </span>
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EntryList entries={entries} interactive={interactive} onDeleteEntry={onDeleteEntry} />
          </CardContent>
        </Card> : <div className="text-center py-4 text-gray-500">
          No entries for this date. Add a new entry using the button above.
        </div>}
    </div>;
};

export default ExistingEntriesList;
