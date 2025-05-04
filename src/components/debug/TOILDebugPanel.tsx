
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createTimeLogger } from "@/utils/time/errors";
import { toilService } from "@/utils/time/services/toil";
import { format } from "date-fns";
import { useTOILSummary } from "@/hooks/timesheet/useTOILSummary";
import { Badge } from "@/components/ui/badge";

const logger = createTimeLogger('TOILDebugPanel');

// Helper function to read data from localStorage
const readFromLocalStorage = (key: string): any => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    logger.error(`Failed to read ${key} from localStorage:`, e);
    return null;
  }
};

interface TOILDebugPanelProps {
  userId: string;
  date: Date;
}

export const TOILDebugPanel: React.FC<TOILDebugPanelProps> = ({ userId, date }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [toilRecords, setToilRecords] = useState<any[]>([]);
  const [toilUsages, setToilUsages] = useState<any[]>([]);
  const [storageKeys, setStorageKeys] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const { summary, refreshSummary } = useTOILSummary({
    userId,
    date,
    monthOnly: true
  });

  // Function to refresh all data
  const refreshData = () => {
    logger.debug('Refreshing TOIL debug data');
    
    // Get all localStorage keys
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allKeys.push(key);
    }
    setStorageKeys(allKeys);
    
    // Get TOIL records and usages
    const records = readFromLocalStorage('toil-records') || [];
    const usages = readFromLocalStorage('toil-usage') || [];
    
    setToilRecords(records.filter((r: any) => r.userId === userId));
    setToilUsages(usages.filter((u: any) => u.userId === userId));
    
    // Update refresh timestamp
    setLastRefresh(new Date());
  };

  // Refresh when props change or panel expands
  useEffect(() => {
    if (isExpanded) {
      refreshData();
    }
  }, [userId, date, isExpanded]);
  
  // Force TOIL calculation (for testing)
  const forceTOILCalculation = async () => {
    logger.debug('Manually forcing TOIL calculation');
    refreshSummary();
  };
  
  // Clear TOIL cache
  const clearTOILCache = () => {
    logger.debug('Manually clearing TOIL cache');
    toilService.clearCache();
    refreshData();
  };

  return (
    <Card className="border-amber-500 bg-amber-50">
      <CardHeader className="py-2 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">TOIL Debug Panel</CardTitle>
          <Badge variant="outline" className="text-xs">DEV ONLY</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 px-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-xs"
        >
          {isExpanded ? "Hide Details" : "Show TOIL Debug Info"}
        </Button>
        
        {isExpanded && (
          <div className="pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium">Current TOIL Summary</h3>
                <p className="text-xs text-gray-500">
                  Month: {format(date, 'MMMM yyyy')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs">
                  <span className="font-medium">Accrued:</span> {summary?.accrued || 0} hrs
                </p>
                <p className="text-xs">
                  <span className="font-medium">Used:</span> {summary?.used || 0} hrs
                </p>
                <p className="text-xs">
                  <span className="font-medium">Remaining:</span> {summary?.remaining || 0} hrs
                </p>
              </div>
            </div>
            
            <Accordion type="single" collapsible>
              <AccordionItem value="toilRecords">
                <AccordionTrigger className="text-xs py-1">
                  TOIL Records ({toilRecords.length})
                </AccordionTrigger>
                <AccordionContent className="max-h-40 overflow-y-auto">
                  {toilRecords.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No records found</p>
                  ) : (
                    toilRecords.map((record, i) => (
                      <div key={record.id || i} className="text-xs border-b py-1">
                        <p><span className="font-medium">Date:</span> {format(new Date(record.date), 'yyyy-MM-dd')}</p>
                        <p><span className="font-medium">Hours:</span> {record.hours}</p>
                        <p><span className="font-medium">Status:</span> {record.status}</p>
                      </div>
                    ))
                  )}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="toilUsage">
                <AccordionTrigger className="text-xs py-1">
                  TOIL Usage ({toilUsages.length})
                </AccordionTrigger>
                <AccordionContent className="max-h-40 overflow-y-auto">
                  {toilUsages.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No usage records found</p>
                  ) : (
                    toilUsages.map((usage, i) => (
                      <div key={usage.id || i} className="text-xs border-b py-1">
                        <p><span className="font-medium">Date:</span> {format(new Date(usage.date), 'yyyy-MM-dd')}</p>
                        <p><span className="font-medium">Hours:</span> {usage.hours}</p>
                      </div>
                    ))
                  )}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="localStorage">
                <AccordionTrigger className="text-xs py-1">
                  LocalStorage Keys ({storageKeys.length})
                </AccordionTrigger>
                <AccordionContent className="max-h-40 overflow-y-auto">
                  <ul className="text-xs">
                    {storageKeys.map((key, i) => (
                      <li key={i} className="py-0.5">
                        {key.includes('toil') ? <strong>{key}</strong> : key}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <p className="text-xs text-gray-500 pt-2">
              Last refreshed: {format(lastRefresh, 'HH:mm:ss')}
            </p>
          </div>
        )}
      </CardContent>
      
      {isExpanded && (
        <CardFooter className="flex gap-2 py-2 px-4">
          <Button size="sm" variant="outline" className="text-xs" onClick={refreshData}>
            Refresh Data
          </Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={forceTOILCalculation}>
            Force TOIL Calculation
          </Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={clearTOILCache}>
            Clear TOIL Cache
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
