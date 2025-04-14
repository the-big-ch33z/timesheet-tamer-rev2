
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDraftContext } from '@/contexts/timesheet/draft-context/DraftContext';
import { TimeEntry } from '@/types';
import EntryFormStep from './steps/EntryFormStep';
import EntryReviewStep from './steps/EntryReviewStep';
import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EntryWizardProps {
  onSubmit: (entry: Omit<TimeEntry, 'id'>) => void;
  date: Date;
  userId: string;
  initialValues?: Partial<TimeEntry>;
  onCancel?: () => void;
}

type WizardStep = 'fill' | 'review';

const EntryWizard: React.FC<EntryWizardProps> = ({
  onSubmit,
  date,
  userId,
  initialValues = {},
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('fill');
  const [formValues, setFormValues] = useState<Partial<TimeEntry>>({
    ...initialValues,
    date,
    userId
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { saveDraft, clearDraft } = useDraftContext();
  const { toast } = useToast();

  const handleFieldChange = (field: string, value: string | number) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    // Validate before proceeding to review
    if (!formValues.hours || formValues.hours <= 0) {
      toast({
        title: "Hours required",
        description: "Please enter the number of hours before continuing.",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentStep('review');
  };

  const handleBack = () => {
    setCurrentStep('fill');
  };

  const handleSaveDraft = () => {
    saveDraft(formValues);
  };

  const handleSubmit = () => {
    if (!formValues.hours || formValues.hours <= 0) {
      toast({
        title: "Hours required",
        description: "Please enter the number of hours before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      onSubmit(formValues as Omit<TimeEntry, 'id'>);
      clearDraft(); // Clear draft after successful submission
      toast({
        title: "Entry submitted",
        description: "Your timesheet entry has been saved successfully."
      });
    } catch (error) {
      console.error('[EntryWizard] Error submitting entry:', error);
      toast({
        title: "Error submitting entry",
        description: "There was a problem saving your entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 shadow-md">
      {/* Wizard header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {currentStep === 'fill' ? 'Fill Timesheet Entry' : 'Review & Submit'}
        </h3>
        <div className="text-sm text-gray-500">
          Step {currentStep === 'fill' ? '1' : '2'} of 2
        </div>
      </div>
      
      {/* Wizard content */}
      <div className="mb-4">
        {currentStep === 'fill' ? (
          <EntryFormStep 
            values={formValues} 
            onFieldChange={handleFieldChange} 
          />
        ) : (
          <EntryReviewStep values={formValues} />
        )}
      </div>
      
      {/* Wizard navigation */}
      <div className="flex justify-between mt-6">
        <div>
          {currentStep === 'review' && (
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex items-center"
            >
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
          )}
          
          {onCancel && currentStep === 'fill' && (
            <Button 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2">
          {currentStep === 'fill' && (
            <>
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                className="flex items-center"
              >
                <Save size={16} className="mr-1" /> Save Draft
              </Button>
              
              <Button 
                onClick={handleNext}
                className="flex items-center bg-blue-500 hover:bg-blue-600"
              >
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            </>
          )}
          
          {currentStep === 'review' && (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center bg-green-500 hover:bg-green-600"
            >
              {isSubmitting ? 'Submitting...' : (
                <>
                  <Check size={16} className="mr-1" /> Submit Entry
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default EntryWizard;
