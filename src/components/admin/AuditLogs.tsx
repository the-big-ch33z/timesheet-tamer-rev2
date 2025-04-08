
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AuditLog } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Shield, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const AuditLogs = () => {
  const { getAuditLogs } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, login, resource, system
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const auditLogs = await getAuditLogs();
        setLogs(auditLogs);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [getAuditLogs]);

  const getActionIcon = (action: string) => {
    if (action === "login" || action === "logout" || action === "register") {
      return <Shield className="h-4 w-4 text-blue-500" />;
    } else if (action.startsWith("delete") || action.includes("remove")) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else {
      return <Info className="h-4 w-4 text-green-500" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action === "login" || action === "logout" || action === "register") {
      return "bg-blue-100 text-blue-800 border-blue-200";
    } else if (action.startsWith("delete") || action.includes("remove")) {
      return "bg-red-100 text-red-800 border-red-200";
    } else {
      return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const filteredLogs = logs.filter(log => {
    // Apply category filter
    if (filter === "login" && !["login", "logout", "register"].includes(log.action)) {
      return false;
    }
    if (filter === "resource" && !["create", "update", "delete"].some(action => log.action.includes(action))) {
      return false;
    }
    if (filter === "system" && !log.action.includes("sync")) {
      return false;
    }
    
    // Apply search term filter
    if (searchTerm) {
      return (
        log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetResource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>Review system activity and security events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select 
            value={filter}
            onValueChange={setFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="login">Authentication</SelectItem>
              <SelectItem value="resource">Resource Changes</SelectItem>
              <SelectItem value="system">System Events</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading audit logs...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>{log.userId}</TableCell>
                      <TableCell>
                        <Badge className={`flex items-center gap-1 ${getActionBadgeColor(log.action)}`}>
                          {getActionIcon(log.action)}
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.targetResource}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No audit logs found matching your criteria.
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

export default AuditLogs;
