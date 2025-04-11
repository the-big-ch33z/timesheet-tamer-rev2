
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EntryFieldsSettings from "@/components/settings/EntryFieldsSettings";
import WorkScheduleSettings from "@/components/settings/WorkScheduleSettings";
import { useTimesheetSettings } from "@/contexts/TimesheetSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle } from "lucide-react";

const SystemSettings = () => {
  const { toast } = useToast();
  const { updateEntryFields } = useTimesheetSettings();

  const handleSaveEntryFields = (fields: any[]) => {
    try {
      updateEntryFields(fields);
      toast({
        title: "Settings saved",
        description: "Entry field settings have been updated successfully",
        variant: "default",
        className: "bg-green-50 border-green-200",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
        icon: <AlertCircle className="h-4 w-4" />
      });
    }
  };

  return (
    <Tabs defaultValue="fields">
      <TabsList className="mb-4">
        <TabsTrigger value="fields">Entry Fields</TabsTrigger>
        <TabsTrigger value="schedule">Work Schedules</TabsTrigger>
      </TabsList>

      <TabsContent value="fields">
        <EntryFieldsSettings 
          onSave={handleSaveEntryFields}
        />
      </TabsContent>

      <TabsContent value="schedule">
        <WorkScheduleSettings />
      </TabsContent>
    </Tabs>
  );
};

export default SystemSettings;
