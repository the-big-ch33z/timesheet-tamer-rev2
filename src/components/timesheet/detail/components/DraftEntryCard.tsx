
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDraftContext } from '@/contexts/timesheet/draft-context/DraftContext';
import { FileText, Edit2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EntryWizard from '../../entry-wizard/EntryWizard';

interface DraftEntryCardProps {
  date: Date;
  userId: string;
  onSubmitEntry: (entry: any) => void;
}

const DraftEntryCard: React.FC<DraftEntryCardProps> = ({
  date,
  userId,
  onSubmitEntry
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { draftEntry, hasDraft, clearDraft, isDraftValid } = useDraftContext();
  const { toast } = useToast();
  
  if (!hasDraft) return null;
  
  const handleContinueEditing = () => {
    setIsEditing(true);
  };
  
  const handleDiscardDraft = () => {
    clearDraft();
    toast({
      title: "Draft discarded",
      description: "Your draft entry has been discarded."
    });
  };
  
  const handleSubmit = (entry: any) => {
    onSubmitEntry(entry);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <EntryWizard
        onSubmit={handleSubmit}
        date={date}
        userId={userId}
        initialValues={draftEntry || {}}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <Card className="mb-4 border-2 border-yellow-400 bg-yellow-50">
      <CardContent className="pt-6">
        <div className="flex items-start">
          <div className="mr-3 mt-1">
            <FileText className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-md font-medium">You have a draft entry</h3>
            <p className="text-sm text-gray-600 mt-1">
              You can continue editing your draft or discard it
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2 justify-end w-full">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDiscardDraft}
          >
            <X className="h-4 w-4 mr-1" /> Discard
          </Button>
          <Button 
            size="sm"
            className="bg-blue-500 hover:bg-blue-600"
            onClick={handleContinueEditing}
          >
            <Edit2 className="h-4 w-4 mr-1" /> Continue Editing
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DraftEntryCard;
