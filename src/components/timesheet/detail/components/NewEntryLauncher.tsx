
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import EntryWizard from '../../entry-wizard/EntryWizard';

interface NewEntryLauncherProps {
  date: Date;
  userId: string;
  onSubmit: (entry: any) => void;
}

const NewEntryLauncher: React.FC<NewEntryLauncherProps> = ({
  date,
  userId,
  onSubmit
}) => {
  const [isCreating, setIsCreating] = useState(false);
  
  const handleStartNewEntry = () => {
    setIsCreating(true);
  };
  
  const handleSubmit = (entry: any) => {
    onSubmit(entry);
    setIsCreating(false);
  };
  
  const handleCancel = () => {
    setIsCreating(false);
  };

  return isCreating ? (
    <EntryWizard
      onSubmit={handleSubmit}
      date={date}
      userId={userId}
      onCancel={handleCancel}
    />
  ) : (
    <Button 
      onClick={handleStartNewEntry} 
      size="sm"
      className="bg-green-500 hover:bg-green-600 text-white"
    >
      <Plus className="h-4 w-4 mr-1" /> Add Entry
    </Button>
  );
};

export default NewEntryLauncher;
