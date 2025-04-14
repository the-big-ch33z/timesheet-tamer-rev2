
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TimeEntry } from '@/types';
import { Card } from '@/components/ui/card';
import EntryWizard from '../entry-wizard/EntryWizard';
import ExistingEntriesList from '../detail/components/ExistingEntriesList';
import { useLogger } from '@/hooks/useLogger';

interface EntryInterfaceProps {
  date: Date;
  userId: string;
  onCreateEntry: (entry: Omit<TimeEntry, "id">) => string | null;
  onDeleteEntry: (entryId: string) => boolean;
  interactive?: boolean;
  existingEntries: TimeEntry[];
}

const EntryInterface: React.FC<EntryInterfaceProps> = ({
  date,
  userId,
  onCreateEntry,
  onDeleteEntry,
  interactive = true,
  existingEntries
}) => {
  const [showWizard, setShowWizard] = useState(false);
  const logger = useLogger('EntryInterface');

  const handleLaunchWizard = () => {
    setShowWizard(true);
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
  };

  const handleWizardSubmit = (entry: Omit<TimeEntry, "id">) => {
    logger.debug("[EntryInterface] Submitting entry:", entry);
    const result = onCreateEntry(entry);
    if (result) {
      setShowWizard(false);
    }
  };

  return (
    <div className="space-y-4">
      <ExistingEntriesList
        entries={existingEntries}
        date={date}
        interactive={interactive}
        onDeleteEntry={onDeleteEntry}
      />

      {interactive && (
        <div>
          {!showWizard ? (
            <Button
              variant="outline"
              className="w-full border-dashed border-2 bg-white hover:bg-gray-50"
              onClick={handleLaunchWizard}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Entry
            </Button>
          ) : (
            <Card className="p-4">
              <EntryWizard
                date={date}
                userId={userId}
                onSubmit={handleWizardSubmit}
                onCancel={handleWizardCancel}
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default EntryInterface;
