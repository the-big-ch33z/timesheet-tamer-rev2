
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { UserScheduleList } from "./UserScheduleList";
import { UserScheduleSearch } from "./UserScheduleSearch";
import { UserScheduleAssignDialog } from "./UserScheduleAssignDialog";
import { User } from "@/types";

const UserScheduleManagement: React.FC = () => {
  const { users } = useAuth();
  const { userSchedules } = useWorkSchedule();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  
  // Filter active users only
  const activeUsers = users.filter(user => user.status !== 'archived');
  
  // Filter users based on search term
  const filteredUsers = activeUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };
  
  const handleAssignSchedule = (user: User) => {
    setSelectedUser(user);
    setIsAssignDialogOpen(true);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Schedule Assignments</CardTitle>
        <CardDescription>
          View and manage which users are assigned to custom work schedules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <UserScheduleSearch 
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
        
        <UserScheduleList 
          users={filteredUsers}
          userSchedules={userSchedules}
          onAssignSchedule={handleAssignSchedule}
        />
        
        <UserScheduleAssignDialog 
          isOpen={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          selectedUser={selectedUser}
        />
      </CardContent>
    </Card>
  );
};

export default UserScheduleManagement;
