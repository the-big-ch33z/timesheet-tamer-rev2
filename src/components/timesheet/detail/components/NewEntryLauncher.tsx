
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TimeEntry } from "@/types";
import EntryWizard from "../../entry-wizard/EntryWizard";

interface NewEntryLauncherProps {
  date: Date;
  userId: string;
  onSubmit: (entry: Omit<TimeEntry, "id">) => void;
  initialValues?: Partial<TimeEntry>;
}

const NewEntryLauncher: React.FC<NewEntryLauncherProps> = ({
  date,
  userId,
  onSubmit,
  initialValues = {}
}) => {
  const [showWizard, setShowWizard] = useState(false);

  const handleLaunchWizard = () => {
    setShowWizard(true);
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
  };

  const handleWizardSubmit = (entry: Omit<TimeEntry, "id">) => {
    onSubmit(entry);
    setShowWizard(false);
  };

  return (
    <div>
      {!showWizard ? (
        <Button 
          variant="outline" 
          className="w-full border-dashed border-2 bg-white hover:bg-gray-50 mt-2"
          onClick={handleLaunchWizard}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Entry
        </Button>
      ) : (
        <EntryWizard
          date={date}
          userId={userId}
          onSubmit={handleWizardSubmit}
          onCancel={handleWizardCancel}
          initialValues={initialValues}
        />
      )}
    </div>
  );
};

export default NewEntryLauncher;
