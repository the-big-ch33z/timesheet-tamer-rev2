
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EntryFieldsSettings from "@/components/settings/EntryFieldsSettings";
import WorkScheduleSettings from "@/components/settings/WorkScheduleSettings";
import { useTimesheetSettings } from "@/contexts/TimesheetSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { EntryFieldConfig } from "@/types";

const SystemSettings = () => {
  const { toast } = useToast();
  const { entryFields, updateEntryFields } = useTimesheetSettings();

  const handleSaveEntryFields = (fields: EntryFieldConfig[]) => {
    updateEntryFields(fields);
    toast({
      title: "Entry fields saved",
      description: "Your entry field settings have been updated",
    });
  };

  return (
    <Tabs defaultValue="fields">
      <TabsList className="mb-4">
        <TabsTrigger value="fields">Entry Fields</TabsTrigger>
        <TabsTrigger value="schedule">Work Schedules</TabsTrigger>
      </TabsList>

      <TabsContent value="fields">
        <EntryFieldsSettings 
          initialFields={entryFields}
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
