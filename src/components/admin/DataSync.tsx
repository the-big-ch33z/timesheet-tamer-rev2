
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Database, AlertCircle, Check, ArrowDownUp, Clock, Loader2, AlertTriangle } from "lucide-react";
import { syncService } from "@/services/syncService";
import { SyncStatus } from "@/types";
import { formatDistance } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DataSync = () => {
  const { toast } = useToast();
  const { syncData } = useAuth();
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch sync statuses on component mount
  useEffect(() => {
    fetchSyncStatuses();
  }, []);

  const fetchSyncStatuses = async () => {
    try {
      setLoading(true);
      const statuses = await syncService.getSyncStatuses();
      setSyncStatuses(statuses);
    } catch (error) {
      console.error("Failed to load sync statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncData();
      await fetchSyncStatuses(); // Refresh statuses after sync
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  // Get status badge for sync status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <Check className="h-3 w-3" /> Success
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Failed
        </Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> In Progress
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  // Format entity type for display
  const formatEntityType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Synchronization</CardTitle>
        <CardDescription>Manage data synchronization with the database</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Database Sync Status</span>
          </div>
          
          <Button 
            onClick={handleSync} 
            disabled={syncing}
            className="flex items-center gap-2"
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 
                Syncing...
              </>
            ) : (
              <>
                <ArrowDownUp className="h-4 w-4" />
                Synchronize Data
              </>
            )}
          </Button>
        </div>
        
        {syncing && (
          <Alert className="bg-blue-50 border-blue-200">
            <Clock className="h-4 w-4" />
            <AlertTitle>Sync in progress</AlertTitle>
            <AlertDescription>
              Synchronizing data with the database. This may take a moment...
            </AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {syncStatuses.length === 0 ? (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No sync history</AlertTitle>
                <AlertDescription>
                  No synchronization has been performed yet. Click the "Synchronize Data" button to begin.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Last Synced</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncStatuses
                    .sort((a, b) => new Date(b.lastSyncedAt).getTime() - new Date(a.lastSyncedAt).getTime())
                    .map((status, index) => (
                      <TableRow key={`${status.entityType}-${index}`}>
                        <TableCell className="font-medium">
                          {formatEntityType(status.entityType)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDistance(new Date(status.lastSyncedAt), new Date(), { addSuffix: true })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(status.status)}</TableCell>
                        <TableCell>{status.recordsProcessed || "-"}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
            <div className="text-xs text-muted-foreground mt-2">
              Next sync should include any changes since the last successful synchronization
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DataSync;
