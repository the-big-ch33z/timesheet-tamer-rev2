
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { Clock, CalendarClock } from "lucide-react";

interface UserScheduleListProps {
  users: User[];
  userSchedules: Record<string, string>;
  onAssignSchedule: (user: User) => void;
}

export const UserScheduleList: React.FC<UserScheduleListProps> = ({
  users,
  userSchedules,
  onAssignSchedule,
}) => {
  const { getScheduleById, defaultSchedule } = useWorkSchedule();
  
  const getScheduleName = (userId: string): string => {
    const scheduleId = userSchedules[userId];
    
    if (!scheduleId) {
      return `${defaultSchedule.name} (Default)`;
    }
    
    const schedule = getScheduleById(scheduleId);
    return schedule ? schedule.name : "Unknown Schedule";
  };
  
  const hasCustomSchedule = (userId: string): boolean => {
    return !!userSchedules[userId];
  };
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Current Schedule</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`flex items-center gap-1 ${
                      hasCustomSchedule(user.id) 
                        ? "bg-blue-50 text-blue-800 border-blue-200" 
                        : "bg-slate-50"
                    }`}
                  >
                    {hasCustomSchedule(user.id) ? (
                      <CalendarClock className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {getScheduleName(user.id)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onAssignSchedule(user)}
                  >
                    {hasCustomSchedule(user.id) ? "Change Schedule" : "Assign Schedule"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                No users found. Try adjusting your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
