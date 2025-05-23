
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";
import { Loader2 } from "lucide-react";
import { TeamMemberMetrics } from '@/hooks/useTeamMemberMetrics';

interface TeamMembersTableProps {
  teamMembers: User[];
  onMemberSelect?: (user: User) => void;
  setUserToArchive: React.Dispatch<React.SetStateAction<string | null>>;
  setUserToRestore: React.Dispatch<React.SetStateAction<string | null>>;
  metrics?: Record<string, TeamMemberMetrics>;
  showMetrics?: boolean;
  selectedMonth?: Date;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({ 
  teamMembers, 
  onMemberSelect,
  setUserToArchive,
  setUserToRestore,
  metrics = {},
  showMetrics = true,
  selectedMonth
}) => {
  const { toast } = useToast();
  
  const handleArchive = (member: User) => {
    setUserToArchive(member.id);
    toast({
      title: "Member archive requested",
      description: `${member.name} will be archived from the team.`
    });
  };
  
  const handleRestore = (member: User) => {
    setUserToRestore(member.id);
    toast({
      title: "Member restore requested",
      description: `${member.name} will be restored to the team.`
    });
  };

  return (
    <div className="mt-4">
      {selectedMonth && showMetrics && (
        <div className="mb-2 text-sm text-muted-foreground">
          Showing metrics for: <span className="font-medium">{selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Role</TableHead>
            {showMetrics && (
              <>
                <TableHead className="text-right">TOIL Balance</TableHead>
                <TableHead className="text-right">Required Hours</TableHead>
                <TableHead className="text-right">Actual Hours</TableHead>
              </>
            )}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map(member => {
            const memberMetrics = metrics[member.id];
            return (
              <TableRow key={member.id}>
                <TableCell className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={member.avatarUrl} 
                      alt={member.name}
                      onError={(e) => {
                        // Set fallback when image fails to load
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <AvatarFallback>
                      {member.name.split(' ').map(name => name[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                  </div>
                </TableCell>
                <TableCell>{member.role}</TableCell>
                
                {showMetrics && (
                  <>
                    <TableCell className="text-right">
                      {memberMetrics?.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                      ) : (
                        <span className={memberMetrics?.toilBalance < 0 ? "text-red-500" : ""}>
                          {memberMetrics?.toilBalance.toFixed(1)}h
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {memberMetrics?.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                      ) : (
                        `${memberMetrics?.requiredHours.toFixed(1)}h`
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {memberMetrics?.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                      ) : (
                        <span className={memberMetrics?.actualHours < memberMetrics?.requiredHours ? "text-amber-600" : "text-green-600"}>
                          {memberMetrics?.actualHours.toFixed(1)}h
                        </span>
                      )}
                    </TableCell>
                  </>
                )}
                
                <TableCell>
                  <Badge 
                    variant={
                      member.status === "active" ? "default" : 
                      member.status === "pending" ? "outline" : 
                      "secondary"
                    }
                  >
                    {member.status || 'active'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {member.status === "archived" ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRestore(member)}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleArchive(member)}
                    >
                      Archive
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TeamMembersTable;
