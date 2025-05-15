
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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

interface TeamMembersTableProps {
  teamMembers: User[];
  onMemberSelect?: (user: User) => void;
  setUserToArchive: React.Dispatch<React.SetStateAction<string | null>>;
  setUserToRestore: React.Dispatch<React.SetStateAction<string | null>>;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({ 
  teamMembers, 
  onMemberSelect,
  setUserToArchive,
  setUserToRestore 
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
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map(member => (
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TeamMembersTable;
