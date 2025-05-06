
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Clock, X } from "lucide-react";

interface FormButtonsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isValid: boolean;
}

export const FormButtons: React.FC<FormButtonsProps> = ({ 
  onCancel, 
  isSubmitting, 
  isValid 
}) => {
  return (
    <div className="flex justify-end space-x-2 mt-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel} 
        disabled={isSubmitting}
        className="flex items-center gap-1"
      >
        <X className="h-4 w-4" />
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting || !isValid}
        className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
        data-testid="save-timeentry-button"
      >
        {isSubmitting ? (
          <>
            <Clock className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Save Entry
          </>
        )}
      </Button>
    </div>
  );
};

export default FormButtons;
