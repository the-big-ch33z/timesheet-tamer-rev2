
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toilService } from '@/utils/time/services/toil';
import { TOILRecord, TOILSummary } from '@/types/toil';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TOILDebugPanel');

interface TOILDebugPanelProps {
  userId: string;
  date: Date;
  onCalculateTOIL?: () => void;
  isCalculating?: boolean;
}

export const TOILDebugPanel: React.FC<TOILDebugPanelProps> = ({
  userId,
  date,
  onCalculateTOIL,
  isCalculating = false
}) => {
  const [toilRecords, setToilRecords] = useState<TOILRecord[]>([]);
  const [summary, setSummary] = useState<TOILSummary | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState('records');
  const [eventHistory, setEventHistory] = useState<any[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Load TOIL data
  useEffect(() => {
    try {
      const loadData = async () => {
        // Load TOIL records
        const { loadTOILRecords } = await import('@/utils/time/services/toil/storage/record-management');
        const allRecords = loadTOILRecords();
        
        // Filter for this user
        const userRecords = allRecords.filter(r => r.userId === userId);
        setToilRecords(userRecords);
        
        // Get summary
        const monthYear = format(date, 'yyyy-MM');
        const userSummary = toilService.getTOILSummary(userId, monthYear);
        setSummary(userSummary);
        
        // Get event history
        const history = timeEventsService.getEventHistory?.() || [];
        setEventHistory(history);
      };
      
      loadData();
    } catch (error) {
      logger.error('Error loading TOIL debug data:', error);
    }
  }, [userId, date, refreshCount]);
  
  // Listen for TOIL updates
  useEffect(() => {
    const subscription = timeEventsService.subscribe('toil-updated', (data) => {
      if (data.userId === userId) {
        logger.debug('TOIL update detected in debug panel:', data);
        // Trigger refresh
        setRefreshCount(prev => prev + 1);
      }
    });
    
    // Also listen to DOM events for backward compatibility
    const handleTOILUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      if (data?.userId === userId) {
        logger.debug('TOIL DOM event detected in debug panel:', data);
        setRefreshCount(prev => prev + 1);
      }
    };
    
    window.addEventListener('toil:summary-updated', handleTOILUpdate);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('toil:summary-updated', handleTOILUpdate);
    };
  }, [userId]);
  
  // Handle manual calculation
  const handleCalculate = useCallback(() => {
    if (onCalculateTOIL) {
      onCalculateTOIL();
    } else {
      // Dispatch generic event to trigger calculation
      timeEventsService.publish('toil-calculated', {
        userId,
        date: date.toISOString(),
        manual: true
      });
    }
    
    // Refresh after a short delay
    setTimeout(() => setRefreshCount(prev => prev + 1), 500);
  }, [onCalculateTOIL, userId, date]);
  
  // Handle cache clear
  const handleClearCache = useCallback(() => {
    toilService.clearCache();
    logger.debug('TOIL cache cleared');
    setRefreshCount(prev => prev + 1);
  }, []);
  
  // Format date for display
  const formatDate = useCallback((date: Date) => {
    return format(date instanceof Date ? date : new Date(date), 'yyyy-MM-dd HH:mm');
  }, []);
  
  return (
    <Card className="w-full bg-slate-50 border border-slate-200">
      <CardHeader className="p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            TOIL Debug Panel {isCalculating ? '(Calculating...)' : ''}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}>
            {expanded ? 'Hide' : 'Show'}
          </Button>
        </div>
        {!expanded && summary && (
          <CardDescription className="text-xs">
            User: {userId} | Month: {format(date, 'yyyy-MM')} | 
            Accrued: {summary.accrued.toFixed(2)}h | 
            Used: {summary.used.toFixed(2)}h | 
            Remaining: {summary.remaining.toFixed(2)}h
          </CardDescription>
        )}
      </CardHeader>
      
      {expanded && (
        <>
          <Tabs value={tab} className="w-full" onValueChange={setTab}>
            <div className="px-4 pt-2">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="records">Records</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-4">
              <TabsContent value="records">
                <div className="max-h-60 overflow-y-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Hours</th>
                        <th className="p-2">Entry ID</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {toilRecords.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-2 text-center">No TOIL records found</td>
                        </tr>
                      )}
                      {toilRecords.map(record => (
                        <tr key={record.id} className="border-t border-slate-200">
                          <td className="p-2">{formatDate(record.date)}</td>
                          <td className="p-2">{record.hours.toFixed(2)}</td>
                          <td className="p-2 font-mono text-[10px]">
                            {record.entryId.substring(0, 8)}...
                          </td>
                          <td className="p-2">{record.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="summary">
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-medium">Accrued</div>
                      <div className="text-2xl font-bold">{summary?.accrued.toFixed(2)}h</div>
                    </div>
                    <div className="p-2 bg-red-50 rounded">
                      <div className="font-medium">Used</div>
                      <div className="text-2xl font-bold">{summary?.used.toFixed(2)}h</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="font-medium">Remaining</div>
                      <div className="text-2xl font-bold">{summary?.remaining.toFixed(2)}h</div>
                    </div>
                  </div>
                  
                  <div className="p-2 bg-slate-100 rounded text-xs">
                    <div className="font-medium">Details</div>
                    <div>User: {summary?.userId}</div>
                    <div>Month: {summary?.monthYear}</div>
                    <div>Records: {toilRecords.length}</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="events">
                <div className="max-h-60 overflow-y-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-2">Time</th>
                        <th className="p-2">Event</th>
                        <th className="p-2">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventHistory.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-2 text-center">No events recorded</td>
                        </tr>
                      )}
                      {eventHistory.filter(evt => evt.type.includes('toil')).map((evt, index) => (
                        <tr key={index} className="border-t border-slate-200">
                          <td className="p-2">{new Date(evt.time).toLocaleTimeString()}</td>
                          <td className="p-2">{evt.type}</td>
                          <td className="p-2 font-mono text-[10px]">
                            {JSON.stringify(evt.data).substring(0, 50)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
          
          <CardFooter className="p-3 bg-slate-100 flex gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setRefreshCount(prev => prev + 1)}
            >
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearCache}
            >
              Clear Cache
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleCalculate}
              disabled={isCalculating}
            >
              {isCalculating ? 'Calculating...' : 'Calculate TOIL'}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
};
