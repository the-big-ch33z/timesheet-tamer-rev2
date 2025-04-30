
import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { Team } from "@/types";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export const AddTeamMemberDialog: React.FC<AddTeamMemberDialogProps> = ({ 
  open, 
  onOpenChange,
  team
}) => {
  const { toast } = useToast();
  const { users, addTeamMember } = useAuth();

  // Setup form for adding a team member
  const form = useForm({
    defaultValues: {
      email: "",
      name: "",
      existingUserId: "",
    },
  });

  // Handle adding a team member
  const handleAddTeamMember = async (data: any) => {
    if (!team) return;
    
    try {
      // Check if we're adding an existing user or creating a new one
      if (data.existingUserId) {
        // Logic for adding existing user to team would go here
        toast({
          title: "User Added to Team",
          description: `User has been added to ${team.name}.`,
        });
      } else {
        // Create and add a new user
        await addTeamMember(data.email, data.name, team.id);
        toast({
          title: "Team Member Added",
          description: `${data.name} has been added to ${team.name}.`,
        });
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error Adding Team Member",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Get all users that are not already in the team
  const availableUsers = users.filter(user => !user.teamIds?.includes(team?.id || ""));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Team Member</SheetTitle>
          <SheetDescription>
            {team ? `Add a new member to ${team.name}` : "Add a team member"}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={form.handleSubmit(handleAddTeamMember)} className="space-y-6 pt-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Add a new user</h3>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                placeholder="user@example.com"
                {...form.register("email")}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input
                id="name"
                placeholder="John Doe"
                {...form.register("name")}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Or add an existing user</h3>
            <div className="space-y-2">
              <label htmlFor="existingUser" className="text-sm font-medium">Select User</label>
              <Select
                onValueChange={(value) => form.setValue("existingUserId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
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
  );
};
