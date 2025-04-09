
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EntryFieldsSettingsProps {
  initialFields?: any[];
  onSave: (fields: any[]) => void;
}

const EntryFieldsSettings: React.FC<EntryFieldsSettingsProps> = ({ 
  onSave 
}) => {
  const handleSave = () => {
    // Save with empty array since we've removed all fields
    onSave([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entry Fields</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">No entry fields are available.</p>
          
          <div className="flex justify-end mt-4">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntryFieldsSettings;
