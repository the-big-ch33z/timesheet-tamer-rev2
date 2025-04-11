
import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { 
  Calendar as CalendarIcon,
  Utensils,
  Coffee,
  Plane,
  Thermometer,
  Clock,
  CreditCard
} from "lucide-react";

interface DetailHeaderProps {
  date: Date;
  formattedDate?: string;
}

const DetailHeader: React.FC<DetailHeaderProps> = ({ date, formattedDate }) => {
  const displayDate = formattedDate || format(date, "MMM dd, yyyy");
  
  return (
    <div className="flex flex-row items-center justify-between pb-2 pt-4 px-6">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-md bg-blue-50">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-semibold">
          Entries for {format(date, "MMM d, yyyy")}
        </CardTitle>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-1 text-sm">
          <CalendarIcon className="h-4 w-4" />
          {format(date, "d MMM yyyy")}
        </Button>
        
        {/* Action buttons */}
        <div className="flex gap-1">
          <Button size="icon" variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
            <Utensils className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
            <Coffee className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
            <Plane className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
            <Thermometer className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
            <Clock className="h-4 w-4" />
          </Button>
        </div>
        
        <Button variant="outline" className="ml-2">
          DTA
        </Button>
      </div>
    </div>
  );
};

export default DetailHeader;
