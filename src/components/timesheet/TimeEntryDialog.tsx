
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
import { useTimesheetSettings } from "@/contexts/TimesheetSettingsContext";

type TimeEntryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  selectedDate: Date;
};

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  selectedDate,
}) => {
  const { getVisibleFields } = useTimesheetSettings();
  const visibleFields = getVisibleFields();
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

  // Helper function to render input based on field type
  const renderField = (field: EntryFieldConfig) => {
    switch (field.name.toLowerCase()) {
      case 'job number':
        return (
          <Input
            id="jobNumber"
            type="text"
            value={jobNumber}
            onChange={(e) => setJobNumber(e.target.value)}
            placeholder={field.placeholder || "Job No."}
            required={field.required}
          />
        );
      case 'rego':
        return (
          <Input
            id="rego"
            type="text"
            value={rego}
            onChange={(e) => setRego(e.target.value)}
            placeholder={field.placeholder || "Rego"}
            required={field.required}
          />
        );
      case 'notes':
        return (
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={field.placeholder || "Notes"}
            required={field.required}
          />
        );
      case 'hours':
        return (
          <Input
            id="hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder={field.placeholder || "Hrs"}
            required={field.required}
            className={field.size === 'small' ? "w-24" : ""}
          />
        );
      default:
        if (!field.name) return null;
        
        return field.type === 'textarea' ? (
          <Textarea
            id={`custom-${field.id}`}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        ) : (
          <Input
            id={`custom-${field.id}`}
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
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
          
          {/* Custom entry fields from settings */}
          <div className="space-y-4">
            {/* Render Job Number and Rego fields in a grid if they exist */}
            {visibleFields.some(f => 
              f.name.toLowerCase() === 'job number' || f.name.toLowerCase() === 'rego'
            ) && (
              <div className="grid grid-cols-2 gap-4">
                {visibleFields.filter(f => f.name.toLowerCase() === 'job number').map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor="jobNumber">{field.name}</Label>
                    {renderField(field)}
                  </div>
                ))}

                {visibleFields.filter(f => f.name.toLowerCase() === 'rego').map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor="rego">{field.name}</Label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            )}

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

            {/* Render Notes field if it exists */}
            {visibleFields.filter(f => f.name.toLowerCase() === 'notes').map(field => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor="description">{field.name}</Label>
                {renderField(field)}
              </div>
            ))}

            {/* Render Hours field if it exists */}
            {visibleFields.filter(f => f.name.toLowerCase() === 'hours').map(field => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor="hours">{field.name}</Label>
                {renderField(field)}
              </div>
            ))}

            {/* Render other custom fields if they exist */}
            {visibleFields.filter(f => 
              !['job number', 'rego', 'notes', 'hours', ''].includes(f.name.toLowerCase())
            ).map(field => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={`custom-${field.id}`}>{field.name}</Label>
                {renderField(field)}
              </div>
            ))}
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
