
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface TOILErrorStateProps {
  error: Error | string;
}

const TOILErrorState: React.FC<TOILErrorStateProps> = ({ error }) => {
  return (
    <Card className="border border-red-200 shadow-sm">
      <CardContent className="p-4">
        <div className="text-red-600 flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold">Error displaying TOIL summary</span>
        </div>
        <div className="text-sm text-red-500">{String(error)}</div>
        <div className="mt-3 text-xs text-gray-500">Try refreshing the page or contact support.</div>
      </CardContent>
    </Card>
  );
};

export default TOILErrorState;
