
import React from "react";
import { format } from "date-fns";
import { Clock, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimeEntry } from "@/types";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TimeEntryItemProps {
  entry: TimeEntry;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

const TimeEntryItem: React.FC<TimeEntryItemProps> = ({ 
  entry, 
  onDelete,
  readOnly = false
}) => {
  const handleDelete = () => {
    onDelete(entry.id);
  };
  
  return (
    <div className="border rounded-md p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{entry.description || "No description"}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            <span>
              {format(new Date(`2000-01-01T${entry.startTime}`), "h:mm a")} - 
              {format(new Date(`2000-01-01T${entry.endTime}`), "h:mm a")}
            </span>
            <span>({entry.hours.toFixed(2)} hrs)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {entry.project && (
            <Badge variant="outline" className="bg-blue-50">
              {entry.project}
            </Badge>
          )}
          {!readOnly && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this time entry? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeEntryItem;
