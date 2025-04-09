
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock } from "lucide-react";
import { TimeEntry, EntryFieldConfig } from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth/AuthProvider";

type TimeEntryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  selectedDate: Date;
  entryFields?: EntryFieldConfig[]; // Add support for custom entry fields
};

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  selectedDate,
  entryFields = [],
}) => {
  const [date, setDate] = useState<Date>(selectedDate);
  const [project, setProject] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [rego, setRego] = useState("");
  const { currentUser } = useAuth();

  // Update hours when start/end time changes
  useEffect(() => {
    if (startTime && endTime) {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      let hoursDiff = endHours - startHours;
      let minutesDiff = endMinutes - startMinutes;
      
      if (minutesDiff < 0) {
        hoursDiff--;
        minutesDiff += 60;
      }
      
      const totalHours = hoursDiff + (minutesDiff / 60);
      setHours(totalHours.toFixed(2));
    }
  }, [startTime, endTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      project,
      hours: parseFloat(hours),
      description,
      startTime,
      endTime,
      userId: currentUser?.id, // Associate entry with current user
      jobNumber,
      rego,
    });
    
    // Reset form
    setProject("");
    setHours("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setJobNumber("");
    setRego("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <div className="relative">
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="relative">
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Job number and rego fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobNumber">Job Number</Label>
              <Input
                id="jobNumber"
                type="text"
                value={jobNumber}
                onChange={(e) => setJobNumber(e.target.value)}
                placeholder="Job No."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rego">Rego</Label>
              <Input
                id="rego"
                type="text"
                value={rego}
                onChange={(e) => setRego(e.target.value)}
                placeholder="Rego"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select
              value={project}
              onValueChange={setProject}
              required
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Website Redesign">Website Redesign</SelectItem>
                <SelectItem value="Mobile App Development">Mobile App Development</SelectItem>
                <SelectItem value="Client Meeting">Client Meeting</SelectItem>
                <SelectItem value="Documentation">Documentation</SelectItem>
                <SelectItem value="Research">Research</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
              placeholder="Hrs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Notes"
              required
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-brand-600 hover:bg-brand-700">Save Entry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TimeEntryDialog;
