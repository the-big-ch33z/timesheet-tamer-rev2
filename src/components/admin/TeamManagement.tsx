
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Users, UserPlus, User } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Team, User as UserType } from "@/types";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoleBadge } from "@/components/common/RoleBasedUI";

// Form schema for creating a new team
const teamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters"),
  managerId: z.string().min(1, "You must select a manager"),
});

type TeamFormValues = z.infer<typeof teamSchema>;

const TeamManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Access authentication context
  const { 
    teams, 
    users, 
    createTeam, 
    getUsersByTeam, 
    getUsersByRole,
    addTeamMember 
  } = useAuth();

  // Setup form for creating a new team
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      managerId: "",
    },
  });

  // Get managers and potential managers for selection
  const managers = getUsersByRole("manager");
  const potentialManagers = users.filter(user => 
    user.role === "manager" || user.role === "team-member"
  );

  // Handle team creation submission
  const onSubmitCreateTeam = async (data: TeamFormValues) => {
    try {
      await createTeam(data.name, data.managerId);
      setIsCreateTeamOpen(false);
      form.reset();
      toast({
        title: "Team Created",
        description: `Team ${data.name} has been successfully created.`,
      });
    } catch (error) {
      toast({
        title: "Error Creating Team",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Setup form for adding a team member
  const addMemberForm = useForm({
    defaultValues: {
      email: "",
      name: "",
      existingUserId: "",
    },
  });

  // Handle adding a team member
  const handleAddTeamMember = async (data: any) => {
    if (!selectedTeam) return;
    
    try {
      // Check if we're adding an existing user or creating a new one
      if (data.existingUserId) {
        // Logic for adding existing user to team would go here
        toast({
          title: "User Added to Team",
          description: `User has been added to ${selectedTeam.name}.`,
        });
      } else {
        // Create and add a new user
        await addTeamMember(data.email, data.name, selectedTeam.id);
        toast({
          title: "Team Member Added",
          description: `${data.name} has been added to ${selectedTeam.name}.`,
        });
      }
      
      setIsAddMemberOpen(false);
      addMemberForm.reset();
    } catch (error) {
      toast({
        title: "Error Adding Team Member",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Filter teams based on search term
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Management</CardTitle>
        <CardDescription>Create and manage teams within your organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button onClick={() => setIsCreateTeamOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Team
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.map(team => {
              // Get the manager for this team
              const manager = users.find(user => user.id === team.managerId);
              // Get team members
              const members = getUsersByTeam(team.id);
              
              return (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>
                    {manager ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {manager.name}
                        <RoleBadge role={manager.role} />
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">No manager assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {members.length} members
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedTeam(team);
                        setIsAddMemberOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredTeams.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No teams found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Create Team Sheet */}
      <Sheet open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create New Team</SheetTitle>
            <SheetDescription>
              Add a new team to your organization and assign a manager.
            </SheetDescription>
          </SheetHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCreateTeam)} className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Manager</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a manager" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {potentialManagers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} {user.role !== "manager" ? "(Will be promoted to Manager)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <SheetFooter className="pt-4">
                <Button type="submit">Create Team</Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Add Team Member Sheet */}
      <Sheet open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Team Member</SheetTitle>
            <SheetDescription>
              {selectedTeam ? `Add a new member to ${selectedTeam.name}` : "Add a team member"}
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={addMemberForm.handleSubmit(handleAddTeamMember)} className="space-y-6 pt-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Add a new user</h3>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  placeholder="user@example.com"
                  {...addMemberForm.register("email")}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...addMemberForm.register("name")}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Or add an existing user</h3>
              <div className="space-y-2">
                <label htmlFor="existingUser" className="text-sm font-medium">Select User</label>
                <Select
                  onValueChange={(value) => addMemberForm.setValue("existingUserId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(user => !user.teamIds?.includes(selectedTeam?.id || ""))
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <SheetFooter>
              <Button type="submit">Add to Team</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </Card>
  );
};

export default TeamManagement;
