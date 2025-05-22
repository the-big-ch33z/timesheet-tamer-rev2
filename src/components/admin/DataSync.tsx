
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SyncStatus } from "@/types";
import { useAuth } from "@/contexts/auth"; // Updated import path
import { RotateCw, Check, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { syncService } from "@/services/syncService";

const DataSync = () => {
  const { syncData } = useAuth();
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const statuses = await syncService.getSyncStatuses();
        setSyncStatuses(statuses);
      } catch (error) {
        console.error("Error fetching sync status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSyncStatus();
  }, []);

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      await syncData();
      const updatedStatuses = await syncService.getSyncStatuses();
      setSyncStatuses(updatedStatuses);
    } catch (error) {
      console.error("Error during sync:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = (status: 'success' | 'failed' | 'in_progress') => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'failed' | 'in_progress') => {
    switch (status) {
      case 'success':
        return "bg-green-100 text-green-800 border-green-200";
      case 'failed':
        return "bg-red-100 text-red-800 border-red-200";
      case 'in_progress':
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Data Synchronization</CardTitle>
            <CardDescription>Sync data with external systems</CardDescription>
          </div>
          <Button 
            onClick={handleSyncData} 
            disabled={isSyncing}
            className="flex items-center gap-2"
          >
            <RotateCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading sync status...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncStatuses.length > 0 ? (
                  syncStatuses.map((status) => (
                    <TableRow key={status.entityType}>
                      <TableCell className="font-medium capitalize">
                        {status.entityType}
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(status.lastSyncedAt), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge className={`flex items-center gap-1 ${getStatusBadge(status.status)}`}>
                          {getStatusIcon(status.status)}
                          {status.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{status.recordsProcessed || 0} records</TableCell>
                      <TableCell>
                        <Progress 
                          value={status.status === 'success' ? 100 : status.status === 'in_progress' ? 50 : 0} 
                          className="h-2"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No sync history available. Click "Sync Now" to start synchronization.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataSync;
