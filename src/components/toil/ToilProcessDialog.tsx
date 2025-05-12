
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { toilService } from "@/utils/time/services/toil";
import { getUserEmploymentType, getToilThreshold, calculateToilDistribution, formatHours } from "./helpers/toilUtils";
import { ToilProcessingFormData } from "@/types/monthEndToil";
import { TOILSummary } from "@/types/toil";
import { useAuth } from "@/contexts/auth";
import { format } from "date-fns";

interface ToilProcessDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  month: string;
  toilSummary: TOILSummary;
}

const ToilProcessDialog: React.FC<ToilProcessDialogProps> = ({ 
  open, 
  onClose, 
  userId, 
  month, 
  toilSummary 
}) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [surplusAction, setSurplusAction] = useState<"paid" | "banked">("paid");
  const [thresholds, setThresholds] = useState(toilService.fetchToilThresholds());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get user employment type and threshold
  const employmentType = getUserEmploymentType(currentUser);
  const threshold = getToilThreshold(employmentType, thresholds);
  
  // Calculate rollover and surplus hours
  const { rolloverHours, surplusHours } = calculateToilDistribution(toilSummary, threshold);
  
  // Format month for display
  const monthDisplay = format(new Date(month + "-01"), "MMMM yyyy");
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const formData: ToilProcessingFormData = {
        userId,
        month,
        totalHours: toilSummary.remaining,
        rolloverHours,
        surplusHours,
        surplusAction
      };
      
      const result = toilService.submitToilProcessing(formData);
      
      toast({
        title: "TOIL Processing Submitted",
        description: "Your TOIL processing request has been submitted for approval.",
      });
      
      onClose();
    } catch (error) {
      console.error("Error submitting TOIL processing:", error);
      toast({
        title: "Error",
        description: "Failed to submit TOIL processing request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Month-End TOIL Processing</DialogTitle>
          <DialogDescription>
            Process your TOIL balance for {monthDisplay}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">TOIL Earned:</span>
              <span className="font-semibold">{formatHours(toilSummary.remaining)} hours</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">Role Threshold:</span>
              <span className="font-semibold">{threshold} hours</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">Rollover Hours:</span>
              <span className="font-semibold">{formatHours(rolloverHours)} hours</span>
            </div>
            
            {surplusHours > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Surplus Hours:</span>
                  <span className="font-semibold">{formatHours(surplusHours)} hours</span>
                </div>
                
                <div className="space-y-2">
                  <Label>Choose how to handle surplus hours:</Label>
                  <RadioGroup 
                    value={surplusAction}
                    onValueChange={(value) => setSurplusAction(value as "paid" | "banked")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paid" id="paid" />
                      <Label htmlFor="paid">Pay out at standard rate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="banked" id="banked" />
                      <Label htmlFor="banked">Bank as leave</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
            
            <div className="bg-muted p-3 rounded-md">
              <h4 className="font-medium mb-2">Processing Notes</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Rollover hours will be available for TOIL use next month</li>
                <li>Submitted TOIL requires manager approval</li>
                <li>Surplus hours will be processed according to your selection</li>
              </ul>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Submit for Approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToilProcessDialog;
