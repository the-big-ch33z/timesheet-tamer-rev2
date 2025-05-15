
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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'archived';
  avatarUrl?: string;
}

interface TeamMembersTableProps {
  members: TeamMember[];
  onArchive: (memberId: string) => void;
  onRestore: (memberId: string) => void;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({ 
  members, 
  onArchive,
  onRestore 
}) => {
  const { toast } = useToast();
  
  const handleArchive = (member: TeamMember) => {
    onArchive(member.id);
    toast({
      title: "Member archived",
      description: `${member.name} has been archived from the team.`
    });
  };
  
  const handleRestore = (member: TeamMember) => {
    onRestore(member.id);
    toast({
      title: "Member restored",
      description: `${member.name} has been restored to the team.`
    });
  };

  // Group members by status
  const activeMembers = members.filter(m => m.status === "active");
  const pendingMembers = members.filter(m => m.status === "pending");
  const archivedMembers = members.filter(m => m.status === "archived");

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
            {members.map(member => (
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
                    {member.status}
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
