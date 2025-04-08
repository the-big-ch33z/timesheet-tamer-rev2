
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Search, FileText, RefreshCcw } from "lucide-react";
import { AuditLog } from "@/types";
import { formatDistance } from "date-fns";

const AuditLogs = () => {
  const { toast } = useToast();
  const { getAuditLogs } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("");

  // Fetch logs on component mount
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const auditLogs = await getAuditLogs();
      setLogs(auditLogs);
    } catch (error) {
      toast({
        title: "Failed to load audit logs",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique action types for filtering
  const actionTypes = Array.from(new Set(logs.map(log => log.action)));

  // Filter logs based on search term and action filter
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetResource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesAction = filterAction ? log.action === filterAction : true;
    
    return matchesSearch && matchesAction;
  });

  // Get badge color for different action types
  const getActionBadgeColor = (action: string) => {
    if (action.includes('create')) return "bg-green-100 text-green-800";
    if (action.includes('update') || action.includes('assign')) return "bg-blue-100 text-blue-800";
    if (action.includes('delete') || action.includes('remove')) return "bg-red-100 text-red-800";
    if (action.includes('login') || action.includes('logout')) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Audit Logs</span>
          <Button size="sm" onClick={fetchLogs} className="flex items-center gap-1">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>Review system activity and security events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full sm:w-64">
            <Select 
              value={filterAction}
              onValueChange={setFilterAction}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                {actionTypes.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">
                          {formatDistance(new Date(log.timestamp), new Date(), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.userId}</TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.targetResource}</TableCell>
                      <TableCell className="max-w-sm truncate">{log.details}</TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {logs.length === 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                        <span>No audit logs found</span>
                      </div>
                    ) : (
                      "No logs match your filters"
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        
        <div className="text-xs text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLogs;
