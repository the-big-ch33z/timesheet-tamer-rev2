
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserRole, User } from "@/types";
import { Plus, Search, Trash2, Edit, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import OrganizationTree from "./OrganizationTree";

// Form schema for editing a user
const userEditSchema = z.object({
  role: z.enum(["admin", "manager", "team-member"] as const),
  teamIds: z.array(z.string()).optional(),
});

type UserEditFormValues = z.infer<typeof userEditSchema>;

const UserManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showOrgTree, setShowOrgTree] = useState(false);

  // Access authentication context
  const { 
    users, 
    teams, 
    updateUserRole, 
    getTeamById,
    getUsersByTeam,
    teamMemberships
  } = useAuth();

  // Setup form for editing a user
  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      role: "team-member",
      teamIds: [],
    },
  });

  // Handle edit user submission
  const onSubmitEditUser = async (data: UserEditFormValues) => {
    if (!selectedUser) return;
    
    try {
      // Update user's role
      await updateUserRole(selectedUser.id, data.role);
      
      // In a real app, we would also update the user's team assignments here
      // For this demo, we'll just show a toast
      toast({
        title: "User Updated",
        description: `${selectedUser.name}'s role has been updated to ${data.role}.`,
      });
      
      setIsEditUserOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: "Error Updating User",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Function to get a user's teams
  const getUserTeams = (userId: string) => {
    const userTeamIds = teamMemberships
      .filter(membership => membership.userId === userId)
      .map(membership => membership.teamId);
      
    return teams.filter(team => userTeamIds.includes(team.id) || team.managerId === userId);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "team-member":
        return "bg-green-100 text-green-800";
    }
  };

  const handleAddUser = () => {
    toast({
      title: "Add User",
      description: "User creation functionality will be implemented soon."
    });
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    
    // Set default form values based on selected user
    form.setValue("role", user.role);
    form.setValue("teamIds", user.teamIds || []);
    
    setIsEditUserOpen(true);
  };
  
  const handleDeleteUser = (userId: string) => {
    toast({
      title: "Delete User",
      description: `Deleting user with ID: ${userId}`
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowOrgTree(!showOrgTree)}
          >
            {showOrgTree ? "Hide Organization Tree" : "Show Organization Tree"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button onClick={handleAddUser} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => {
                // Get user's teams
                const userTeams = getUserTeams(user.id);
                
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {userTeams.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {userTeams.map(team => (
                            <Badge key={team.id} variant="outline" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {team.name}
                              {team.managerId === user.id && " (Manager)"}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">No teams</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Organization Tree Card (conditionally rendered) */}
      {showOrgTree && <OrganizationTree />}

      {/* Edit User Sheet */}
      <Sheet open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit User</SheetTitle>
            <SheetDescription>
              {selectedUser ? `Update details for ${selectedUser.name}` : "Update user details"}
            </SheetDescription>
          </SheetHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEditUser)} className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="team-member">Team Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Teams selection would go here in a more complex implementation */}
              
              <SheetFooter className="pt-4">
                <Button type="submit">Update User</Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default UserManagement;
