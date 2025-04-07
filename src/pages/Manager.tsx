
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, AlertCircle, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  division: string;
  status: "active" | "on-leave" | "inactive";
  hoursThisWeek: number;
  timesheetStatus: "approved" | "pending" | "rejected";
};

const DIVISIONS = ["Engineering", "Design", "Marketing", "Operations"];

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Frontend Developer",
    avatar: "",
    division: "Engineering",
    status: "active",
    hoursThisWeek: 38,
    timesheetStatus: "approved",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "UX Designer",
    avatar: "",
    division: "Design",
    status: "active",
    hoursThisWeek: 35,
    timesheetStatus: "pending",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael.brown@example.com",
    role: "Project Manager",
    avatar: "",
    division: "Engineering",
    status: "on-leave",
    hoursThisWeek: 20,
    timesheetStatus: "approved",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    role: "Backend Developer",
    avatar: "",
    division: "Engineering",
    status: "active",
    hoursThisWeek: 42,
    timesheetStatus: "rejected",
  },
  {
    id: "5",
    name: "Robert Chen",
    email: "robert.chen@example.com",
    role: "Marketing Specialist",
    avatar: "",
    division: "Marketing",
    status: "active",
    hoursThisWeek: 36,
    timesheetStatus: "pending",
  },
];

const Manager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  
  const filteredMembers = TEAM_MEMBERS.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         member.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         member.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDivision = selectedDivision === "all" || member.division === selectedDivision;
    
    return matchesSearch && matchesDivision;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const getStatusColor = (status: TeamMember["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "on-leave":
        return "bg-amber-100 text-amber-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "";
    }
  };

  const getTimesheetStatusIcon = (status: TeamMember["timesheetStatus"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-brand-800 mb-6">Team Management</h1>
      
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="timesheets">Pending Timesheets</TabsTrigger>
          <TabsTrigger value="divisions">Divisions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={selectedDivision}
                onValueChange={setSelectedDivision}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {DIVISIONS.map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Member
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team members and their time entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-[1fr_1fr_150px_150px_100px] bg-muted px-4 py-3 text-sm font-medium">
                  <div>Name</div>
                  <div>Role</div>
                  <div>Division</div>
                  <div>Hours This Week</div>
                  <div className="text-right">Status</div>
                </div>
                
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="grid grid-cols-[1fr_1fr_150px_150px_100px] items-center px-4 py-3 border-t hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {member.email}
                          </div>
                        </div>
                      </div>
                      
                      <div>{member.role}</div>
                      
                      <div>{member.division}</div>
                      
                      <div className="flex items-center gap-2">
                        {member.hoursThisWeek} hrs
                        {getTimesheetStatusIcon(member.timesheetStatus)}
                      </div>
                      
                      <div className="text-right">
                        <Badge variant="outline" className={getStatusColor(member.status)}>
                          {member.status === "active"
                            ? "Active"
                            : member.status === "on-leave"
                            ? "On Leave"
                            : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-muted-foreground">
                    No team members found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timesheets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Timesheets</CardTitle>
              <CardDescription>
                Review and approve timesheet submissions from your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TEAM_MEMBERS.filter(m => m.timesheetStatus === "pending").map((member) => (
                  <div
                    key={member.id}
                    className="border rounded-md p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {member.division} • {member.role}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm">{member.hoursThisWeek} hours this week</div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="destructive" size="sm">
                        Reject
                      </Button>
                      <Button size="sm" className="bg-brand-600 hover:bg-brand-700">
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
                
                {TEAM_MEMBERS.filter(m => m.timesheetStatus === "pending").length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-brand-500 mb-3" />
                    <h3 className="text-lg font-medium mb-1">All caught up!</h3>
                    <p className="text-muted-foreground">
                      No pending timesheet submissions to review
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="divisions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Divisions</CardTitle>
                <CardDescription>
                  Manage divisions across your organization
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Division
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DIVISIONS.map((division) => {
                  const memberCount = TEAM_MEMBERS.filter(
                    (m) => m.division === division
                  ).length;
                  
                  return (
                    <div
                      key={division}
                      className="flex justify-between items-center border rounded-md p-4 hover:bg-muted/50"
                    >
                      <div>
                        <h3 className="font-medium">{division}</h3>
                        <p className="text-sm text-muted-foreground">
                          {memberCount} members
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Manager;
