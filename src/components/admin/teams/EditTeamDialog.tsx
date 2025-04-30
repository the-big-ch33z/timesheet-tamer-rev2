
import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { Team } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export const EditTeamDialog: React.FC<EditTeamDialogProps> = ({
  open,
  onOpenChange,
  team
}) => {
  const { toast } = useToast();
  const { users, assignManagerToTeam, teams, setTeams } = useAuth();
  
  // Get all admin and manager users
  const eligibleManagers = users.filter(
    user => user.role === 'admin' || user.role === 'manager'
  );
  
  // Setup form for editing a team
  const form = useForm({
    defaultValues: {
      name: team?.name || "",
      managerId: team?.managerId || "",
    },
  });
  
  // Reset form when team changes
  React.useEffect(() => {
    if (team) {
      form.reset({
        name: team.name,
        managerId: team.managerId,
      });
    }
  }, [team, form]);
  
  // Handle editing a team
  const handleEditTeam = async (data: { name: string; managerId: string }) => {
    if (!team) return;
    
    try {
      // Update team name if changed
      if (data.name !== team.name) {
        // Update team in state
        const updatedTeam = { ...team, name: data.name };
        setTeams(prev => prev.map(t => t.id === team.id ? updatedTeam : t));
        
        toast({
          title: "Team Name Updated",
          description: `Team name has been changed to ${data.name}.`,
        });
      }
      
      // Update team manager if changed
      if (data.managerId !== team.managerId) {
        await assignManagerToTeam(data.managerId, team.id);
        
        const newManager = users.find(user => user.id === data.managerId);
        toast({
          title: "Team Manager Updated",
          description: `${newManager?.name || 'New manager'} has been assigned as the team manager.`,
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error Updating Team",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update the team details for {team.name}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleEditTeam)} className="space-y-6 pt-4">
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
                  <FormLabel>Team Manager</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligibleManagers.map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} ({manager.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
