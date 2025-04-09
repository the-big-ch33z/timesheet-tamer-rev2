
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash } from "lucide-react";
import { EntryFieldConfig } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EntryFieldsSettingsProps {
  initialFields?: EntryFieldConfig[];
  onSave: (fields: EntryFieldConfig[]) => void;
}

const EntryFieldsSettings: React.FC<EntryFieldsSettingsProps> = ({ 
  initialFields = [],
  onSave 
}) => {
  // Set default fields if none provided - only include one row (4 fields)
  const defaultFields: EntryFieldConfig[] = [
    { id: '1', name: 'Job Number', type: 'text', required: false, visible: true, placeholder: 'Job No.' },
    { id: '2', name: 'Rego', type: 'text', required: false, visible: true, placeholder: 'Rego' },
    { id: '3', name: 'Notes', type: 'textarea', required: true, visible: true, placeholder: 'Notes' },
    { id: '4', name: 'Hours', type: 'number', required: true, visible: true, placeholder: 'Hrs', size: 'small' },
  ];

  const [fields, setFields] = useState<EntryFieldConfig[]>(
    initialFields.length > 0 ? 
      // If initialFields is provided but has more than 4 items, only take the first 4
      initialFields.length > 4 ? initialFields.slice(0, 4) : initialFields
      : defaultFields
  );

  const handleVisibilityToggle = (id: string) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, visible: !field.visible } : field
    ));
  };

  const handleNameChange = (id: string, name: string) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, name } : field
    ));
  };

  const handlePlaceholderChange = (id: string, placeholder: string) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, placeholder } : field
    ));
  };

  const handleSave = () => {
    onSave(fields);
  };

  // Always ensure we have exactly 4 fields
  const ensureExactlyFourFields = () => {
    if (fields.length < 4) {
      const fieldsToAdd = 4 - fields.length;
      const newFields = [...fields];
      
      for (let i = 0; i < fieldsToAdd; i++) {
        const newId = Date.now().toString() + i;
        newFields.push({ 
          id: newId, 
          name: '', 
          type: i === 3 ? 'number' : 'text', 
          required: false, 
          visible: true, 
          placeholder: '',
          size: i === 3 ? 'small' : undefined
        });
      }
      
      setFields(newFields);
    } else if (fields.length > 4) {
      setFields(fields.slice(0, 4));
    }
  };

  // Ensure we have exactly 4 fields on component mount
  React.useEffect(() => {
    ensureExactlyFourFields();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entry Fields</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* One row with 4 fields */}
          <div className="grid grid-cols-12 gap-4 items-center border p-4 rounded-md">
            {fields.map((field, colIndex) => (
              <div 
                key={field.id} 
                className={colIndex === 3 ? "col-span-2" : "col-span-3"} // Make Hours field smaller
              >
                <Input
                  value={field.name}
                  onChange={(e) => handleNameChange(field.id, e.target.value)}
                  placeholder={`Field ${colIndex + 1} Name`}
                  className="mb-2"
                />
                <Input
                  value={field.placeholder || ''}
                  onChange={(e) => handlePlaceholderChange(field.id, e.target.value)}
                  placeholder="Placeholder"
                  className="text-sm"
                />
              </div>
            ))}
            <div className="col-span-2 flex items-center space-x-2">
              <Switch 
                checked={fields.every(field => field.visible)}
                onCheckedChange={() => {
                  const allVisible = fields.every(field => field.visible);
                  setFields(fields.map(field => ({ ...field, visible: !allVisible })));
                }}
                id="visible-row"
              />
              <Label htmlFor="visible-row">Visible</Label>
            </div>
            <div className="col-span-1 flex justify-center">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntryFieldsSettings;
