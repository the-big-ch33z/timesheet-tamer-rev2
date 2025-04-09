
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddEntryButtonProps {
  onClick: () => void;
  date?: Date; // Making date optional to avoid breaking changes
}

const AddEntryButton: React.FC<AddEntryButtonProps> = ({ onClick, date }) => {
  return (
    <Button 
      onClick={onClick}
      className="w-full bg-green-600 hover:bg-green-700 text-white my-2"
      size="sm"
    >
      <Plus className="h-4 w-4 mr-1" /> Add Entry
    </Button>
  );
};

export default AddEntryButton;
