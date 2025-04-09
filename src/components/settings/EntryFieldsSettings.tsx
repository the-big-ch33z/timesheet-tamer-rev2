
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash, Plus, Move } from "lucide-react";
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
  // Set default fields if none provided
  const defaultFields: EntryFieldConfig[] = [
    { id: '1', name: 'Job Number', type: 'text', required: false, visible: true, placeholder: 'Job No.' },
    { id: '2', name: 'Rego', type: 'text', required: false, visible: true, placeholder: 'Rego' },
    { id: '3', name: 'Notes', type: 'textarea', required: true, visible: true, placeholder: 'Notes' },
    { id: '4', name: 'Hours', type: 'number', required: true, visible: true, placeholder: 'Hrs', size: 'small' },
    // Empty row
    { id: '5', name: '', type: 'text', required: false, visible: true, placeholder: '' },
    { id: '6', name: '', type: 'text', required: false, visible: true, placeholder: '' },
    { id: '7', name: '', type: 'text', required: false, visible: true, placeholder: '' },
    { id: '8', name: '', type: 'number', required: false, visible: true, placeholder: '' },
  ];

  const [fields, setFields] = useState<EntryFieldConfig[]>(
    initialFields.length > 0 ? initialFields : defaultFields
  );

  const handleVisibilityToggle = (id: string) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, visible: !field.visible } : field
    ));
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
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

  const addNewRow = () => {
    const newId = Date.now().toString();
    setFields([
      ...fields,
      { id: newId + '1', name: '', type: 'text', required: false, visible: true, placeholder: '' },
      { id: newId + '2', name: '', type: 'text', required: false, visible: true, placeholder: '' },
      { id: newId + '3', name: '', type: 'text', required: false, visible: true, placeholder: '' },
      { id: newId + '4', name: '', type: 'number', required: false, visible: true, placeholder: '' },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entry Fields</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Group fields by rows of 4 */}
          {Array.from({ length: Math.ceil(fields.length / 4) }).map((_, rowIndex) => {
            const rowFields = fields.slice(rowIndex * 4, rowIndex * 4 + 4);
            return (
              <div key={rowIndex} className="grid grid-cols-12 gap-2 items-center border p-2 rounded-md">
                {rowFields.map((field, colIndex) => (
                  <div 
                    key={field.id} 
                    className={colIndex === 3 ? "col-span-2" : "col-span-3"} // Make Hours field smaller
                  >
                    <div className="space-y-1">
                      <Input
                        value={field.name}
                        onChange={(e) => handleNameChange(field.id, e.target.value)}
                        placeholder={`Field ${colIndex + 1} Name`}
                        className="text-sm"
                      />
                      <Input
                        value={field.placeholder || ''}
                        onChange={(e) => handlePlaceholderChange(field.id, e.target.value)}
                        placeholder="Watermark"
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch 
                    checked={rowFields[0]?.visible || false}
                    onCheckedChange={() => rowFields[0] && handleVisibilityToggle(rowFields[0].id)}
                    id={`visible-${rowIndex}`}
                  />
                  <Label htmlFor={`visible-${rowIndex}`}>Visible</Label>
                </div>
                <div className="col-span-1 text-right">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => rowFields[0] && handleDeleteField(rowFields[0].id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          
          <div className="flex justify-between mt-4">
            <Button onClick={addNewRow} variant="outline" className="gap-1">
              <Plus className="h-4 w-4" /> Add Row
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntryFieldsSettings;
