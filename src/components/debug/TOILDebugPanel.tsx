import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { 
  toilService, 
  loadTOILRecords, 
  loadTOILUsage,
  cleanupDuplicateTOILRecords,
  cleanupDuplicateTOILUsage
} from '@/utils/time/services/toil';
import { TOILRecord, TOILSummary, TOILUsage } from '@/types/toil';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { createTimeLogger } from '@/utils/time/errors';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, RefreshCw, Trash2 } from 'lucide-react';
import { createTOILUpdateHandler } from '@/utils/time/events/toilEventService';

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
  const [toilUsage, setToilUsage] = useState<TOILUsage[]>([]);
  const [summary, setSummary] = useState<TOILSummary | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState('records');
  const [eventHistory, setEventHistory] = useState<any[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [status, setStatus] = useState<{message: string, type: 'success' | 'error' | 'info' | 'warning'} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const monthYear = format(date, 'yyyy-MM');
  
  // Load TOIL data
  useEffect(() => {
    try {
      setStatus({message: 'Loading data...', type: 'info'});
      setIsProcessing(true);
      
      const loadData = async () => {
        // Load TOIL records with proper logging
        try {
          console.log(`[TOILDebugPanel] Loading TOIL records for user ${userId}`);
          const allRecords = loadTOILRecords(userId) as TOILRecord[];
          console.log(`[TOILDebugPanel] Loaded ${allRecords.length} TOIL records`);
          setToilRecords(allRecords || []);
          
          console.log(`[TOILDebugPanel] Loading TOIL usage for user ${userId}`);
          const allUsage = loadTOILUsage(userId) as TOILUsage[];
          console.log(`[TOILDebugPanel] Loaded ${allUsage.length} TOIL usage records`);
          setToilUsage(allUsage || []);
          
          // Get summary
          console.log(`[TOILDebugPanel] Getting TOIL summary for user ${userId}`);
          const userSummary = toilService.getTOILSummary(userId, monthYear);
          console.log(`[TOILDebugPanel] TOIL summary:`, userSummary);
          setSummary(userSummary);
          
          // Get event history
          const history = timeEventsService.getEventHistory?.() || [];
          const filteredHistory = history.filter(evt => evt.type.includes('toil'));
          console.log(`[TOILDebugPanel] Found ${filteredHistory.length} TOIL events`);
          setEventHistory(filteredHistory);
          
          setStatus({message: 'Data loaded successfully', type: 'success'});
        } catch (error) {
          logger.error('Error loading TOIL debug data:', error);
          console.error(`[TOILDebugPanel] Error loading TOIL debug data:`, error);
          setStatus({message: 'Error loading data', type: 'error'});
        } finally {
          setIsProcessing(false);
        }
      };
      
      loadData();
    } catch (error) {
      logger.error('Error in TOIL debug panel setup:', error);
      console.error(`[TOILDebugPanel] Error in TOIL debug panel setup:`, error);
      setStatus({message: 'Error in debug panel setup', type: 'error'});
      setIsProcessing(false);
    }
  }, [userId, monthYear, refreshCount]);
  
  // Listen for TOIL updates using the unified handler
  useEffect(() => {
    const handleTOILUpdate = createTOILUpdateHandler(
      userId,
      monthYear,
      {
        onValidUpdate: (data) => {
          logger.debug('TOIL summary update received in debug panel:', data);
          console.log('[TOILDebugPanel] TOIL summary update received:', data);
          // No need to set summary directly here as we'll refresh
          setRefreshCount(prev => prev + 1);
          setStatus({message: 'TOIL update detected', type: 'info'});
        },
        onRefresh: () => {
          logger.debug('TOIL update - triggering refresh in debug panel');
          console.log('[TOILDebugPanel] TOIL update - triggering refresh');
          setRefreshCount(prev => prev + 1);
          setStatus({message: 'TOIL update detected', type: 'info'});
        },
        onLog: (message, data) => {
          // Special debug panel logging
          console.log(`[TOILDebugPanel] ${message}`, data);
        }
      }
    );
    
    const subscription = timeEventsService.subscribe('toil-updated', (data) => {
      if (data.userId === userId) {
        logger.debug('TOIL update detected in debug panel:', data);
        console.log('[TOILDebugPanel] TOIL update detected:', data);
        // Trigger refresh
        setRefreshCount(prev => prev + 1);
        setStatus({message: 'TOIL update detected', type: 'info'});
      }
    });
    
    // Also listen to DOM events for backward compatibility
    window.addEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('toil:summary-updated', handleTOILUpdate as EventListener);
    };
  }, [userId, monthYear]);
  
  // Handle manual calculation
  const handleCalculate = useCallback(() => {
    setStatus({message: 'Calculating TOIL...', type: 'info'});
    setIsProcessing(true);
    
    try {
      console.log('[TOILDebugPanel] Manual TOIL calculation triggered');
      
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
      setTimeout(() => {
        setRefreshCount(prev => prev + 1);
        setStatus({message: 'TOIL calculation requested', type: 'success'});
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      logger.error('Error in manual TOIL calculation:', error);
      console.error('[TOILDebugPanel] Error in manual TOIL calculation:', error);
      setStatus({message: 'Error calculating TOIL', type: 'error'});
      setIsProcessing(false);
    }
  }, [onCalculateTOIL, userId, date]);
  
  // Handle cache clear
  const handleClearCache = useCallback(() => {
    try {
      setStatus({message: 'Clearing cache...', type: 'info'});
      setIsProcessing(true);
      
      console.log('[TOILDebugPanel] Clearing TOIL cache');
      toilService.clearCache();
      logger.debug('TOIL cache cleared');
      
      setTimeout(() => {
        setRefreshCount(prev => prev + 1);
        setStatus({message: 'Cache cleared successfully', type: 'success'});
        setIsProcessing(false);
      }, 300);
    } catch (error) {
      logger.error('Error clearing TOIL cache:', error);
      console.error('[TOILDebugPanel] Error clearing TOIL cache:', error);
      setStatus({message: 'Error clearing cache', type: 'error'});
      setIsProcessing(false);
    }
  }, []);
  
  // Handle cleanup
  const handleCleanup = useCallback(async () => {
    try {
      setStatus({message: 'Running cleanup...', type: 'info'});
      setIsProcessing(true);
      
      console.log(`[TOILDebugPanel] Running cleanup for user ${userId}`);
      const recordsRemoved = await cleanupDuplicateTOILRecords(userId);
      const usageRemoved = await cleanupDuplicateTOILUsage(userId);
      console.log(`[TOILDebugPanel] Cleanup removed ${recordsRemoved} records and ${usageRemoved} usage entries`);
      
      setTimeout(() => {
        setRefreshCount(prev => prev + 1);
        setStatus({
          message: `Cleanup complete. Removed ${recordsRemoved} records and ${usageRemoved} usage entries`,
          type: 'success'
        });
        setIsProcessing(false);
      }, 300);
    } catch (error) {
      logger.error('Error during TOIL cleanup:', error);
      console.error('[TOILDebugPanel] Error during TOIL cleanup:', error);
      setStatus({message: 'Error during cleanup', type: 'error'});
      setIsProcessing(false);
    }
  }, [userId]);
  
  // Format date for display
  const formatDate = useCallback((date: Date | string) => {
    return format(date instanceof Date ? date : new Date(date), 'yyyy-MM-dd HH:mm');
  }, []);
  
  return (
    <Card className="w-full bg-slate-50 border border-slate-200">
      <CardHeader className="p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">
              TOIL Debug Panel
            </CardTitle>
            {isCalculating && (
              <Badge variant="outline" className="animate-pulse bg-amber-100">
                Calculating...
              </Badge>
            )}
            {isProcessing && (
              <Badge variant="outline" className="animate-pulse bg-blue-100">
                Processing...
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}>
            {expanded ? 'Hide' : 'Show'}
          </Button>
        </div>
        {!expanded && summary && (
          <CardDescription className="text-xs">
            User: {userId} | Month: {monthYear} | 
            Accrued: {summary.accrued.toFixed(2)}h | 
            Used: {summary.used.toFixed(2)}h | 
            Remaining: {summary.remaining.toFixed(2)}h
          </CardDescription>
        )}
        
        {status && !expanded && (
          <div className={`text-xs mt-1 p-1 rounded ${
            status.type === 'error' ? 'bg-red-100 text-red-800' :
            status.type === 'success' ? 'bg-green-100 text-green-800' :
            status.type === 'warning' ? 'bg-amber-100 text-amber-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {status.message}
          </div>
        )}
      </CardHeader>
      
      {expanded && (
        <div>
          <div className="px-4 pt-2">
            {status && (
              <Alert variant={status.type === 'error' ? 'destructive' : 'default'} className="mb-4 py-2">
                <div className="flex gap-2 items-center">
                  {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
                  {status.type === 'success' && <Check className="h-4 w-4" />}
                  {status.type === 'info' && <RefreshCw className="h-4 w-4" />}
                  <AlertTitle className="text-sm">{status.message}</AlertTitle>
                </div>
              </Alert>
            )}
            
            <div className="text-sm mb-2">
              <span className="font-medium">Current State:</span> {toilRecords.length} records, {toilUsage.length} usage entries
            </div>
          </div>
          
          <Tabs value={tab} className="w-full" onValueChange={setTab}>
            <div className="px-4">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="records">Records ({toilRecords.length})</TabsTrigger>
                <TabsTrigger value="usage">Usage ({toilUsage.length})</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="events">Events ({eventHistory.length})</TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-4">
              <TabsContent value="records">
                <div className="max-h-60 overflow-y-auto text-xs">
                  {toilRecords.length === 0 ? (
                    <div className="p-4 text-center bg-gray-50">No TOIL records found</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2">Hours</th>
                          <th className="p-2">ID</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {toilRecords.map((record, i) => (
                          <tr key={record.id || i} className="border-t border-slate-200">
                            <td className="p-2">{formatDate(record.date)}</td>
                            <td className="p-2">{record.hours?.toFixed(2) || 'N/A'}</td>
                            <td className="p-2 font-mono text-[10px]">{record.id?.substring(0, 8) || 'N/A'}</td>
                            <td className="p-2">{record.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="usage">
                <div className="max-h-60 overflow-y-auto text-xs">
                  {toilUsage.length === 0 ? (
                    <div className="p-4 text-center bg-gray-50">No TOIL usage found</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2">Hours</th>
                          <th className="p-2">Entry ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {toilUsage.map((usage, i) => (
                          <tr key={usage.id || i} className="border-t border-slate-200">
                            <td className="p-2">{formatDate(usage.date)}</td>
                            <td className="p-2">{usage.hours?.toFixed(2) || 'N/A'}</td>
                            <td className="p-2 font-mono text-[10px]">{usage.entryId?.substring(0, 8) || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="summary">
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-medium">Accrued</div>
                      <div className="text-2xl font-bold">{summary?.accrued.toFixed(2) || '0.00'}h</div>
                    </div>
                    <div className="p-2 bg-red-50 rounded">
                      <div className="font-medium">Used</div>
                      <div className="text-2xl font-bold">{summary?.used.toFixed(2) || '0.00'}h</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="font-medium">Remaining</div>
                      <div className="text-2xl font-bold">{summary?.remaining.toFixed(2) || '0.00'}h</div>
                    </div>
                  </div>
                  
                  <div className="p-2 bg-slate-100 rounded text-xs">
                    <div className="font-medium">Details</div>
                    <div>User: {summary?.userId}</div>
                    <div>Month: {summary?.monthYear}</div>
                    <div>Records: {toilRecords.length}</div>
                    <div>Usage Records: {toilUsage.length}</div>
                    <div>LocalStorage Keys: {Object.keys(localStorage).filter(k => k.includes('toil')).length}</div>
                  </div>
                  
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                    <div className="font-medium">Local Storage Contents</div>
                    <div className="mt-1 p-1 bg-slate-100 rounded font-mono text-[10px] max-h-20 overflow-y-auto">
                      {Object.keys(localStorage).filter(k => k.includes('toil')).map(key => (
                        <div key={key} className="mb-1">
                          <span className="font-bold">{key}</span>: {localStorage.getItem(key)?.substring(0, 50)}...
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="events">
                <div className="max-h-60 overflow-y-auto text-xs">
                  {eventHistory.length === 0 ? (
                    <div className="p-4 text-center bg-gray-50">No events recorded</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2">Time</th>
                          <th className="p-2">Event</th>
                          <th className="p-2">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventHistory.map((evt, i) => (
                          <tr key={i} className="border-t border-slate-200">
                            <td className="p-2">{new Date(evt.time).toLocaleTimeString()}</td>
                            <td className="p-2">{evt.type}</td>
                            <td className="p-2 font-mono text-[10px]">
                              {JSON.stringify(evt.data).substring(0, 30)}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
          
          <CardFooter className="p-3 bg-slate-100 flex gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('[TOILDebugPanel] Manual refresh triggered');
                setRefreshCount(prev => prev + 1);
              }}
              disabled={isProcessing}
              className="flex gap-1 items-center"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCleanup}
              disabled={isProcessing}
              className="flex gap-1 items-center"
            >
              <Trash2 className="h-3 w-3" />
              Cleanup
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearCache}
              disabled={isProcessing}
            >
              Clear Cache
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleCalculate}
              disabled={isCalculating || isProcessing}
            >
              Calculate TOIL
            </Button>
          </CardFooter>
        </div>
      )}
    </Card>
  );
};
