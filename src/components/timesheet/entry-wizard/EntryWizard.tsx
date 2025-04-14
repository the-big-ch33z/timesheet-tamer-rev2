
import React, { useState, useEffect } from 'react';
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
    userId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { saveDraft, clearDraft } = useDraftContext();
  const { toast } = useToast();
  
  // Log initial values when component mounts
  useEffect(() => {
    console.debug('[EntryWizard] Component mounted with initialValues:', initialValues);
    console.debug('[EntryWizard] Initial form values set to:', formValues);
  }, []);
  
  // Log values whenever they change for debugging
  useEffect(() => {
    console.debug('[EntryWizard] Form values updated:', formValues);
    
    // Specifically log time values for debugging
    if ('startTime' in formValues || 'endTime' in formValues) {
      console.debug('[EntryWizard] Time values updated:', {
        startTime: formValues.startTime || 'not set',
        endTime: formValues.endTime || 'not set'
      });
    }
  }, [formValues]);

  const handleFieldChange = (field: string, value: string | number) => {
    console.debug(`[EntryWizard] Field change: ${field}=${value}`);
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
    
    // Log all form values before going to review step
    console.debug("[EntryWizard] Moving to review step with values:", formValues);
    setCurrentStep('review');
  };

  const handleBack = () => {
    setCurrentStep('fill');
  };

  const handleSaveDraft = () => {
    console.debug("[EntryWizard] Saving draft with values:", formValues);
    saveDraft(formValues);
    toast({
      title: "Draft saved",
      description: "Your entry draft has been saved."
    });
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
    
    // Log submission values for debugging
    console.debug("[EntryWizard] Submitting entry with values:", formValues);
    
    try {
      // Ensure we have all required fields
      const entryToSubmit: Omit<TimeEntry, 'id'> = {
        date: formValues.date || date,
        hours: formValues.hours || 0,
        description: formValues.description || '',
        jobNumber: formValues.jobNumber || '',
        rego: formValues.rego || '',
        taskNumber: formValues.taskNumber || '',
        userId: formValues.userId || userId,
        // Don't set default values for times if not provided
        startTime: formValues.startTime || '',
        endTime: formValues.endTime || '',
        project: formValues.project || 'General'
      };
      
      console.debug("[EntryWizard] Final submission data:", entryToSubmit);
      onSubmit(entryToSubmit);
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
