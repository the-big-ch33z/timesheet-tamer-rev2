
export interface TimeEntry {
  id: string;
  date: Date;
  project: string;
  hours: number;
  description: string;
  startTime?: string;
  endTime?: string;
}

export interface EntryFieldConfig {
  id: string;
  name: string;
  type: 'text' | 'select' | 'time' | 'number';
  required: boolean;
  options?: string[];
  icon?: string;
  visible: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD format
  region: string;
}
