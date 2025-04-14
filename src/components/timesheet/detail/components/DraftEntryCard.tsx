
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useDraftContext } from "@/contexts/timesheet/draft-context/DraftContext";
import { TimeEntry } from "@/types";
import EntryWizard from "../../entry-wizard/EntryWizard";

interface DraftEntryCardProps {
  date: Date;
  userId: string;
  onSubmitEntry: (entry: Omit<TimeEntry, "id">) => void;
  initialValues?: Partial<TimeEntry>;
}

const DraftEntryCard: React.FC<DraftEntryCardProps> = ({ 
  date, 
  userId, 
  onSubmitEntry,
  initialValues = {}
}) => {
  const { draftEntry, hasDraft, clearDraft } = useDraftContext();
  const [isEditing, setIsEditing] = useState(false);

  // If there's no draft, don't render anything
  if (!hasDraft) {
    return null;
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    clearDraft();
  };

  const handleSubmit = (entry: Omit<TimeEntry, "id">) => {
    onSubmitEntry(entry);
    clearDraft();
    setIsEditing(false);
  };

  // If editing, show the wizard
  if (isEditing) {
    return (
      <EntryWizard
        date={date}
        userId={userId}
        onSubmit={handleSubmit}
        onCancel={handleCancelEdit}
        initialValues={{
          ...(draftEntry || {}),
          ...initialValues
        }}
      />
    );
  }

  // Show draft summary card
  return (
    <Card className="mb-4">
      <CardHeader className="bg-amber-50 pb-2">
        <CardTitle className="text-sm font-medium text-amber-700">Draft Entry</CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 pb-2">
        <div className="space-y-1">
          {draftEntry?.hours && (
            <p className="text-sm"><span className="font-medium">Hours:</span> {draftEntry.hours}</p>
          )}
          
          {draftEntry?.jobNumber && (
            <p className="text-sm"><span className="font-medium">Job:</span> {draftEntry.jobNumber}</p>
          )}
          
          {draftEntry?.description && (
            <p className="text-sm"><span className="font-medium">Description:</span> {draftEntry.description.substring(0, 50)}{draftEntry.description.length > 50 ? '...' : ''}</p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2 pt-0">
        <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        
        <Button variant="outline" size="sm" onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DraftEntryCard;
