
import React, { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabContent from "./TabContent";
import { useTimesheetUIContext } from "@/contexts/timesheet";
import MonthlyToilManager from "../toil/MonthlyToilManager";
import { useTOILSummary } from "@/hooks/timesheet/useTOILSummary";
import { useTimeEntryContext } from "@/contexts/timesheet/entries-context";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TimesheetTabs');

const TimesheetTabs = () => {
  const { activeTab, setActiveTab } = useTimesheetUIContext();
  const { entries } = useTimeEntryContext();
  const { toast } = useToast();
  
  // Get current user info for TOIL summary
  const userId = entries[0]?.userId || localStorage.getItem('currentUserId') || '';
  const currentDate = new Date();
  const currentMonth = format(currentDate, 'yyyy-MM');
  
  // Track when TOIL tab is activated for cleanup
  const [toilTabActivated, setToilTabActivated] = useState(false);
  
  // Get TOIL summary with auto-refresh when the tab changes
  const { summary, isLoading, refreshSummary } = useTOILSummary({
    userId,
    date: currentDate,
    monthOnly: true
  });
  
  // Handle tab change with cleanup when TOIL tab is activated
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    
    if (value === 'month-end-toil' && !toilTabActivated) {
      logger.debug('TOIL tab activated, running cleanup');
      setToilTabActivated(true);
      
      // Import and run cleanup when TOIL tab is first activated
      import('@/utils/time/services/toil/storage/cleanup')
        .then(({ cleanupAllToilData }) => {
          cleanupAllToilData(userId)
            .then(hasChanges => {
              if (hasChanges) {
                logger.debug('TOIL data cleaned up on tab activation');
                refreshSummary();
                toast({
                  title: "TOIL Data Optimized",
                  description: "Your TOIL data has been updated to fix inconsistencies."
                });
              }
            })
            .catch(err => {
              logger.error('Error during TOIL cleanup:', err);
            });
        })
        .catch(err => {
          logger.error('Error importing cleanup module:', err);
        });
    }
  }, [setActiveTab, toilTabActivated, userId, refreshSummary, toast]);
  
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8" defaultValue="timesheet">
      <TabsList className="mb-4">
        <TabsTrigger value="timesheet">Calendar View</TabsTrigger>
        <TabsTrigger value="recent">Recent Entries</TabsTrigger>
        <TabsTrigger value="month-end-toil">TOIL Management</TabsTrigger>
      </TabsList>

      {/* Content for timesheet and recent entries tabs */}
      <TabContent />
      
      {/* Month-End TOIL Tab Content */}
      <TabsContent value="month-end-toil">
        <MonthlyToilManager />
      </TabsContent>
    </Tabs>
  );
};

export default TimesheetTabs;
