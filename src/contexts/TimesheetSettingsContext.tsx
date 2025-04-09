
import React, { createContext, useContext, useState, useEffect } from 'react';
import { EntryFieldConfig } from '@/types';

// Default entry fields
const DEFAULT_ENTRY_FIELDS: EntryFieldConfig[] = [
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

interface TimesheetSettingsContextType {
  entryFields: EntryFieldConfig[];
  updateEntryFields: (fields: EntryFieldConfig[]) => void;
  getVisibleFields: () => EntryFieldConfig[];
}

const TimesheetSettingsContext = createContext<TimesheetSettingsContextType>({
  entryFields: DEFAULT_ENTRY_FIELDS,
  updateEntryFields: () => {},
  getVisibleFields: () => [],
});

export const useTimesheetSettings = () => useContext(TimesheetSettingsContext);

export const TimesheetSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entryFields, setEntryFields] = useState<EntryFieldConfig[]>(DEFAULT_ENTRY_FIELDS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedFields = localStorage.getItem('timesheetEntryFields');
      if (savedFields) {
        setEntryFields(JSON.parse(savedFields));
      }
    } catch (error) {
      console.error("Error loading timesheet settings:", error);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('timesheetEntryFields', JSON.stringify(entryFields));
  }, [entryFields]);

  const updateEntryFields = (fields: EntryFieldConfig[]) => {
    setEntryFields(fields);
  };

  const getVisibleFields = () => {
    return entryFields.filter(field => field.visible);
  };

  return (
    <TimesheetSettingsContext.Provider 
      value={{ entryFields, updateEntryFields, getVisibleFields }}
    >
      {children}
    </TimesheetSettingsContext.Provider>
  );
};
