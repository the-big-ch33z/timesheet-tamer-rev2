
# Migration Guide: Time Utilities Refactoring

This document provides guidance for migrating code from the old time utilities approach to the new centralized architecture.

## Key Changes

1. **Centralized Utilities** - All time-related functionality is now centralized in the `/utils/time` directory
2. **Service-Based Approach** - Major operations now use the timeEntryService
3. **Standardized Hook Layer** - Components should interact with hooks, not utilities directly
4. **Context-Based State Management** - Global state is managed by context providers

## Migration Steps

### Step 1: Replace Direct Utility Imports

**Old:**
```tsx
import { calculateHours } from '@/components/timesheet/utils/timeCalculations';
```

**New:**
```tsx
import { calculateHoursFromTimes } from '@/utils/time/calculations';
```

### Step 2: Replace Direct State Management with Hooks

**Old:**
```tsx
const [entries, setEntries] = useState<TimeEntry[]>([]);
const loadEntries = () => {
  const savedEntries = localStorage.getItem('timeEntries');
  if (savedEntries) {
    setEntries(JSON.parse(savedEntries));
  }
};
```

**New:**
```tsx
import { useTimeEntries } from '@/hooks/timesheet/useTimeEntries';

const { entries, isLoading } = useTimeEntries(userId);
```

### Step 3: Replace Entry Management Logic

**Old:**
```tsx
const handleSaveEntry = (entry: TimeEntry) => {
  const newEntries = [...entries, entry];
  setEntries(newEntries);
  localStorage.setItem('timeEntries', JSON.stringify(newEntries));
};
```

**New:**
```tsx
import { useTimeEntries } from '@/hooks/timesheet/useTimeEntries';

const { createEntry } = useTimeEntries(userId);

const handleSaveEntry = (entryData: Omit<TimeEntry, 'id'>) => {
  createEntry(entryData);
};
```

### Step 4: Replace WorkHours Management

**Old:**
```tsx
const [workHours, setWorkHours] = useState({ startTime: '', endTime: '' });
const saveWorkHours = (start: string, end: string) => {
  setWorkHours({ startTime: start, endTime: end });
  localStorage.setItem('workHours', JSON.stringify({ startTime: start, endTime: end }));
};
```

**New:**
```tsx
import { useWorkHours } from '@/hooks/timesheet/useWorkHours';

const { saveWorkHoursForDate } = useWorkHours(userId);

const handleSave = (start: string, end: string) => {
  saveWorkHoursForDate(date, start, end, userId);
};
```

### Step 5: Replace Time Validation Logic

**Old:**
```tsx
const isValidTime = (time: string) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
```

**New:**
```tsx
import { isValidTimeFormat } from '@/utils/time/validation';

const isValid = isValidTimeFormat(time);
```

## Common Migration Scenarios

### Scenario 1: TimeEntryManager Component

**Old:**
```tsx
// Direct state management and localStorage access
const [entries, setEntries] = useState<TimeEntry[]>([]);
useEffect(() => {
  const savedEntries = localStorage.getItem('timeEntries');
  if (savedEntries) setEntries(JSON.parse(savedEntries));
}, []);

const addEntry = (entry: TimeEntry) => {
  const newEntries = [...entries, entry];
  setEntries(newEntries);
  localStorage.setItem('timeEntries', JSON.stringify(newEntries));
};
```

**New:**
```tsx
// Use the timeEntries hook
import { useTimeEntries } from '@/hooks/timesheet/useTimeEntries';

const { entries, createEntry } = useTimeEntries(userId, date);

const addEntry = (entryData: Omit<TimeEntry, 'id'>) => {
  createEntry(entryData);
};
```

### Scenario 2: TimeHeader Component

**Old:**
```tsx
// Direct calculations and validation
import { calculateHours } from '@/components/timesheet/utils/timeCalculations';

const calculatedHours = calculateHours(startTime, endTime);

const isValidTime = (time: string) => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};
```

**New:**
```tsx
// Use the timeCalculations hook
import { useTimeCalculations } from '@/hooks/timesheet/useTimeCalculations';
import { isValidTimeFormat } from '@/utils/time/validation';

const { calculateHours } = useTimeCalculations();
const calculatedHours = calculateHours(startTime, endTime);
const isValid = isValidTimeFormat(time);
```

## Error Handling

The new architecture provides standardized error handling:

**Old:**
```tsx
try {
  const hours = calculateHours(start, end);
} catch (e) {
  console.error('Error calculating hours:', e);
}
```

**New:**
```tsx
import { createTimeLogger } from '@/utils/time/errors';
import { safeTimeOperation } from '@/utils/time/errors/timeErrorHandling';

const logger = createTimeLogger('ComponentName');

const hours = safeTimeOperation(
  () => calculateHoursFromTimes(start, end), 
  0, // default value
  'Calculate hours'
);
```

## Testing Changes

Test files have been updated to mock the new services:

**Old:**
```tsx
// Mocking localStorage directly
jest.spyOn(Storage.prototype, 'getItem');
```

**New:**
```tsx
// Mock the service module
jest.mock('@/utils/time/services/timeEntryService', () => ({
  timeEntryService: {
    getUserEntries: jest.fn(() => []),
    createEntry: jest.fn(),
    // ...
  }
}));
```

For any questions during migration, please refer to the comprehensive documentation or contact the architecture team.
