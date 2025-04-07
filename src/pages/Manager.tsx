
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  Edit,
  FileText,
  Filter,
  RefreshCw,
  Trash,
  UserPlus,
  Users,
} from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeType: string;
  status: "active" | "on-leave" | "inactive";
  requiredHours: number;
  actualHours: number;
  toilBalance: number;
  toilRollover: number;
  paidHours: number;
  bankedLeave: number;
};

// Sample data for team members
const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Aidan Hart",
    email: "aidan.h89@live.com.au",
    role: "Employee",
    employeeType: "Full Time",
    status: "active",
    requiredHours: 0,
    actualHours: 159.6,
    toilBalance: 19.0,
    toilRollover: 0.0,
    paidHours: 0,
    bankedLeave: 0,
  },
  {
    id: "2",
    name: "Bob",
    email: "kimack2@yahoo.com.au",
    role: "Employee",
    employeeType: "Full Time",
    status: "active",
    requiredHours: 0,
    actualHours: 168.0,
    toilBalance: 0.0,
    toilRollover: 0.0,
    paidHours: 0,
    bankedLeave: 0,
  },
  {
    id: "3",
    name: "Bob John",
    email: "brou_dot_com@hotmail.com",
    role: "Employee",
    employeeType: "Full Time",
    status: "active",
    requiredHours: 0,
    actualHours: 159.6,
    toilBalance: 0.0,
    toilRollover: 0.0,
    paidHours: 0,
    bankedLeave: 0,
  },
];

const Manager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Calculate stats
  const activeEmployeesCount = TEAM_MEMBERS.filter(m => m.status === "active").length;
  const totalToilHours = TEAM_MEMBERS.reduce((total, member) => total + member.toilBalance, 0);
  const pendingApprovalsCount = 0; // Mock data - would come from a real API
  const totalBankedLeave = TEAM_MEMBERS.reduce((total, member) => total + member.bankedLeave, 0);

  // Filter team members based on search query
  const filteredMembers = TEAM_MEMBERS.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Employee Manager</h1>
        <p className="text-muted-foreground">Manage your team members and view their statistics.</p>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Employees</p>
                <h2 className="text-3xl font-bold">{activeEmployeesCount}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-full">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total TOIL Hours</p>
                <h2 className="text-3xl font-bold">{totalToilHours.toFixed(1)}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-full">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <h2 className="text-3xl font-bold">{pendingApprovalsCount}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-50 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Banked Leave</p>
                <h2 className="text-3xl font-bold">{totalBankedLeave.toFixed(1)}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Employee Overview</TabsTrigger>
          <TabsTrigger value="toil-report">TOIL Approval Report</TabsTrigger>
          <TabsTrigger value="dta-report">DTA Approval Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Active Employees</h2>
              
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>2025-04</span>
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Filters
                  </Button>
                </div>
                
                <Button size="sm" className="gap-1" onClick={() => console.log("Refresh data")}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                
                <Button variant="default" size="sm" className="gap-1">
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </Button>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Required Hours</TableHead>
                    <TableHead>Actual Hours</TableHead>
                    <TableHead>TOIL Balance</TableHead>
                    <TableHead>TOIL Rollover</TableHead>
                    <TableHead>Paid Hrs</TableHead>
                    <TableHead>Banked Leave</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div>{member.role}</div>
                          <div className="text-xs text-muted-foreground">{member.employeeType}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </TableCell>
                      
                      <TableCell>{member.requiredHours} hrs</TableCell>
                      <TableCell>{member.actualHours.toFixed(1)}</TableCell>
                      <TableCell>{member.toilBalance.toFixed(1)}</TableCell>
                      <TableCell>{member.toilRollover.toFixed(1)}</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>{member.bankedLeave}</TableCell>
                      
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-500">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="toil-report">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold mb-6">TOIL Approval Report</h2>
            <p className="text-muted-foreground">
              This section would display Time Off In Lieu (TOIL) approvals and reports.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="dta-report">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold mb-6">DTA Approval Report</h2>
            <p className="text-muted-foreground">
              This section would display DTA approvals and reports.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Manager;
