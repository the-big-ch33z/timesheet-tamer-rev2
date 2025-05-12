
import React, { useState, useEffect, useCallback } from "react";
import { format, subMonths } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { useTOILSummary } from "@/hooks/timesheet/useTOILSummary";
import ToilProcessDialog from "./ToilProcessDialog";
import { TOILSummary as TOILSummaryComponent } from "@/components/toil/TOILSummary";
import { toilService } from "@/utils/time/services/toil";
import { isMonthProcessable, getUserEmploymentType, getToilThreshold } from "./helpers/toilUtils";
import { ToilProcessingStatus } from "@/types/monthEndToil";
import { createTimeLogger } from "@/utils/time/errors";

// Create a logger for MonthlyToilManager
const logger = createTimeLogger('MonthlyToilManager');

const MonthlyToilManager: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const userId = currentUser?.id || "";
  
  // Default to previous month for month-end processing
  const previousMonth = subMonths(new Date(), 1);
  const [selectedMonth, setSelectedMonth] = useState(format(previousMonth, "yyyy-MM"));
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processingEnabled, setProcessingEnabled] = useState(false);
  
  // Log which month is being viewed initially
  useEffect(() => {
    logger.debug(`Initial month selected: ${selectedMonth}, previous month is ${format(previousMonth, "yyyy-MM")}`);
  }, []);
  
  // Get TOIL summary for selected month
  const { summary, isLoading, error, refreshSummary } = useTOILSummary({
    userId,
    date: new Date(selectedMonth + "-01"),
    monthOnly: true
  });
  
  // Log TOIL summary changes
  useEffect(() => {
    if (summary) {
      logger.debug(`TOIL summary for ${selectedMonth}:`, { 
        accrued: summary.accrued,
        used: summary.used,
        remaining: summary.remaining,
        monthYear: summary.monthYear
      });
    } else if (isLoading) {
      logger.debug(`Loading TOIL summary for ${selectedMonth}...`);
    } else if (error) {
      logger.error(`Error loading TOIL summary for ${selectedMonth}:`, error);
    }
  }, [summary, isLoading, error, selectedMonth]);
  
  // Check if month can be processed
  const checkIfMonthCanBeProcessed = useCallback(() => {
    if (!summary || !userId) {
      setProcessingEnabled(false);
      return;
    }
    
    // Fix: More permissive month processability check for April
    const isProcessable = isMonthProcessable(selectedMonth) && summary.remaining > 0;

    // Check if this month has already been processed
    const existingRecord = toilService.getToilProcessingRecordForMonth(userId, selectedMonth);
    
    logger.debug(`Month processability check:`, { 
      month: selectedMonth,
      isProcessable,
      hasRemainingHours: summary.remaining > 0,
      alreadyProcessed: !!existingRecord,
      processingEnabled: isProcessable && !existingRecord
    });
    
    setProcessingEnabled(isProcessable && !existingRecord);
  }, [selectedMonth, summary, userId]);
  
  // Effect to check if month can be processed
  useEffect(() => {
    checkIfMonthCanBeProcessed();
  }, [selectedMonth, summary, userId, checkIfMonthCanBeProcessed]);

  // Listen for processing state updates
  useEffect(() => {
    const handleStateUpdate = () => {
      logger.debug('Processing state updated, refreshing...');
      refreshSummary();
      checkIfMonthCanBeProcessed();
    };

    window.addEventListener('toil-month-state-updated', handleStateUpdate);
    window.addEventListener('toil-month-end-submitted', handleStateUpdate);
    
    return () => {
      window.removeEventListener('toil-month-state-updated', handleStateUpdate);
      window.removeEventListener('toil-month-end-submitted', handleStateUpdate);
    };
  }, [refreshSummary, checkIfMonthCanBeProcessed]);
  
  // Generate last 12 months for the dropdown
  const generateMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      const value = format(date, "yyyy-MM");
      const label = format(date, "MMMM yyyy"); // Full month name for clarity
      options.push({ value, label, date });
    }
    return options;
  };
  
  const monthOptions = generateMonthOptions();
  
  // Handle month change
  const handleMonthChange = (value: string) => {
    logger.debug(`Month changed to: ${value}`);
    setSelectedMonth(value);
    refreshSummary(); // Force refresh on month change
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
  const processingState = toilService.getMonthProcessingState(userId, selectedMonth);
  
  // Log current processing state
  useEffect(() => {
    logger.debug(`Current processing state for ${selectedMonth}:`, processingState);
  }, [processingState, selectedMonth]);
  
  // Force a refresh function for testing when data isn't showing up
  const forceRefreshData = () => {
    if (!userId) return;
    
    refreshSummary();
    toast({
      title: "Refreshed TOIL Data",
      description: "TOIL data has been refreshed for the selected month.",
    });
  };
  
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
          ) : error ? (
            <div className="py-4 text-center text-red-500">
              Error loading data: {error}
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={forceRefreshData}
              >
                Retry
              </Button>
            </div>
          ) : (
            <TOILSummaryComponent 
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
              <p className="text-xs text-muted-foreground mt-2">
                Last updated: {new Date(processingState.lastUpdated).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            const prevMonthStr = format(previousMonth, "yyyy-MM");
            setSelectedMonth(prevMonthStr);
            logger.debug(`Reset to previous month: ${prevMonthStr}`);
            refreshSummary();
          }}
        >
          Reset to Previous Month
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={forceRefreshData}
          >
            Refresh Data
          </Button>
          <Button 
            onClick={handleOpenProcessDialog}
            disabled={!processingEnabled || isLoading}
          >
            Process Month-End TOIL
          </Button>
        </div>
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
