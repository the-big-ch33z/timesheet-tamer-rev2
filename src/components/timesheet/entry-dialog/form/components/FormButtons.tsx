
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormButtonsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isValid: boolean;
}

const FormButtons: React.FC<FormButtonsProps> = ({
  onCancel,
  isSubmitting,
  isValid
}) => {
  // Log props for debugging
  console.debug('[FormButtons] Rendering with props:', {
    isSubmitting, 
    isValid,
    hasOnCancel: !!onCancel
  });

  // Track when isSubmitting changes
  useEffect(() => {
    console.debug(`[FormButtons:useEffect] isSubmitting changed to: ${isSubmitting}`);
  }, [isSubmitting]);

  // Track when isValid changes
  useEffect(() => {
    console.debug(`[FormButtons:useEffect] isValid changed to: ${isValid}`);
  }, [isValid]);

  const handleCancel = () => {
    console.debug('[FormButtons:handleCancel] Cancel button clicked');
    if (onCancel) {
      onCancel();
      console.debug('[FormButtons:handleCancel] onCancel callback executed');
    } else {
      console.error('[FormButtons:handleCancel] onCancel is not defined');
    }
  };

  return (
    <div className="flex justify-end gap-3 pt-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting || !isValid}
        data-testid="submit-button"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Entry"
        )}
      </Button>
    </div>
  );
};

export default FormButtons;
