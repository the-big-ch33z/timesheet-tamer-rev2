
import React from "react";
import { TimeEntry } from "@/types";
import EntryList from "./EntryList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ExistingEntriesListProps {
  entries: TimeEntry[];
  date: Date;
  interactive?: boolean;
  onDeleteEntry: (entryId: string) => Promise<boolean>;
}

const ExistingEntriesList: React.FC<ExistingEntriesListProps> = ({
  entries,
  interactive = true,
  onDeleteEntry
}) => {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Time Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <EntryList 
          entries={entries}
          interactive={interactive}
          onDelete={onDeleteEntry}
        />
      </CardContent>
    </Card>
  );
};

export default ExistingEntriesList;
