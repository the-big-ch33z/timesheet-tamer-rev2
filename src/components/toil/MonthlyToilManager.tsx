
import React, { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { useTOILSummary } from "@/hooks/timesheet/useTOILSummary";
import ToilProcessDialog from "./ToilProcessDialog";
import { ToilSummary } from "./ToilSummary";
import { fetchToilThresholds } from "@/services/toil/ToilSettingsService";
import { fetchToilByMonth, getMonthProcessingState, getToilProcessingRecordForMonth } from "@/services/toil/ToilProcessingService";
import { isMonthProcessable, getUserEmploymentType, getToilThreshold } from "./helpers/toilUtils";
import { ToilProcessingStatus } from "@/types/monthEndToil";

const MonthlyToilManager: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const userId = currentUser?.id || "";
  
  // Default to previous month for month-end processing
  const previousMonth = subMonths(new Date(), 1);
  const [selectedMonth, setSelectedMonth] = useState(format(previousMonth, "yyyy-MM"));
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processingEnabled, setProcessingEnabled] = useState(false);
  
  // Get TOIL summary for selected month
  const { summary, isLoading, error } = useTOILSummary({
    userId,
    date: new Date(selectedMonth + "-01"),
    monthOnly: true
  });
  
  // Effect to check if month can be processed
  useEffect(() => {
    if (!summary || !userId) return;
    
    const canProcess = isMonthProcessable(selectedMonth) && 
      (summary.remaining > 0) &&
      !getToilProcessingRecordForMonth(userId, selectedMonth);
    
    setProcessingEnabled(canProcess);
  }, [selectedMonth, summary, userId]);

  // Listen for processing state updates
  useEffect(() => {
    const handleStateUpdate = () => {
      // Force re-render to reflect new state
      setSelectedMonth(prev => prev);
    };

    window.addEventListener('toil-month-state-updated', handleStateUpdate);
    window.addEventListener('toil-month-end-submitted', handleStateUpdate);
    
    return () => {
      window.removeEventListener('toil-month-state-updated', handleStateUpdate);
      window.removeEventListener('toil-month-end-submitted', handleStateUpdate);
    };
  }, []);
  
  // Generate last 12 months for the dropdown
  const generateMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      const value = format(date, "yyyy-MM");
      const label = format(date, "MMMM yyyy");
      options.push({ value, label });
    }
    return options;
  };
  
  const monthOptions = generateMonthOptions();
  
  // Handle month change
  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };
  
  // Open process dialog
  const handleOpenProcessDialog = () => {
    if (processingEnabled && summary) {
      setShowProcessDialog(true);
    } else {
      toast({
        title: "Cannot Process TOIL",
        description: "This month is not eligible for processing or has already been processed.",
        variant: "destructive",
      });
    }
  };
  
  // Get processing status for this month
  const processingState = getMonthProcessingState(userId, selectedMonth);
  
  if (!currentUser) {
    return <div>Please log in to view your TOIL.</div>;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Monthly TOIL Management</CardTitle>
        <CardDescription>
          Process Time Off In Lieu (TOIL) at the end of each month
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="month-select">Select Month</Label>
            <Select 
              value={selectedMonth} 
              onValueChange={handleMonthChange}
            >
              <SelectTrigger id="month-select" className="w-full">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center">Loading TOIL data...</div>
          ) : (
            <ToilSummary 
              summary={summary} 
              showRollover={!!processingState && processingState.status === ToilProcessingStatus.COMPLETED}
            />
          )}
          
          {processingState && (
            <div className="rounded-lg bg-muted p-4 mt-4">
              <h4 className="font-semibold">Processing Status</h4>
              <p className="text-sm mt-1">
                {processingState.status === ToilProcessingStatus.IN_PROGRESS && (
                  <span className="text-amber-600">Pending approval</span>
                )}
                {processingState.status === ToilProcessingStatus.COMPLETED && (
                  <span className="text-green-600">Completed</span>
                )}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setSelectedMonth(format(previousMonth, "yyyy-MM"))}
        >
          Reset to Previous Month
        </Button>
        <Button 
          onClick={handleOpenProcessDialog}
          disabled={!processingEnabled || isLoading}
        >
          Process Month-End TOIL
        </Button>
      </CardFooter>
      
      {showProcessDialog && summary && (
        <ToilProcessDialog 
          open={showProcessDialog}
          onClose={() => setShowProcessDialog(false)}
          userId={userId}
          month={selectedMonth}
          toilSummary={summary}
        />
      )}
    </Card>
  );
};

export default MonthlyToilManager;
