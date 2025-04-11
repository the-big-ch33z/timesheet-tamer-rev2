
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddEntryButtonProps {
  onClick: () => void;
  date?: Date;
}

const AddEntryButton: React.FC<AddEntryButtonProps> = ({ onClick, date }) => {
  return (
    <Button 
      onClick={onClick}
      className="bg-blue-800 hover:bg-blue-900 text-white"
      size="default"
    >
      <Plus className="h-5 w-5 mr-1" /> Add Entry
    </Button>
  );
};

export default AddEntryButton;
