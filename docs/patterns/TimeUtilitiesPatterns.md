
# Common Patterns for Working with Time Utilities

This document outlines common usage patterns for working with the time utilities library in our application.

## Working with Time Entries

### Creating a New Time Entry

```tsx
import { useTimeEntries } from '@/hooks/timesheet/useTimeEntries';

function MyComponent() {
  const { createEntry } = useTimeEntries('user-123');
  
  const handleAddEntry = () => {
    createEntry({
      date: new Date(),
      startTime: '09:00',
      endTime: '17:00',
      hours: 8,
      description: 'Development work',
      userId: 'user-123'
    });
  };
  
  return <button onClick={handleAddEntry}>Add Entry</button>;
}
```

### Fetching Entries for a Specific Day

```tsx
import { useTimeEntries } from '@/hooks/timesheet/useTimeEntries';
import { format } from 'date-fns';

function DayEntries({ date, userId }) {
  const { entries, isLoading } = useTimeEntries(userId, date);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h3>Entries for {format(date, 'MMMM d, yyyy')}</h3>
      <ul>
        {entries.map(entry => (
          <li key={entry.id}>{entry.hours} hours - {entry.description}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Calculating Total Hours

```tsx
import { useTimeEntries } from '@/hooks/timesheet/useTimeEntries';

function TotalHours({ userId, date }) {
  const { entries, calculateTotalHours } = useTimeEntries(userId, date);
  const totalHours = calculateTotalHours();
  
  return <div>Total Hours: {totalHours}</div>;
}
```

## Working with Work Hours

### Setting Custom Work Hours

```tsx
import { useWorkHours } from '@/hooks/timesheet/useWorkHours';

function WorkHoursEditor({ date, userId }) {
  const { saveWorkHoursForDate } = useWorkHours(userId);
  
  const handleSave = (startTime, endTime) => {
    saveWorkHoursForDate(date, startTime, endTime, userId);
  };
  
  return (
    <div>
      {/* Time input fields */}
      <button onClick={() => handleSave('09:00', '17:00')}>Save</button>
    </div>
  );
}
```

### Checking if a User Has Custom Hours

```tsx
import { useWorkHours } from '@/hooks/timesheet/useWorkHours';

function CustomHoursIndicator({ date, userId }) {
  const { hasCustomHours } = useWorkHours();
  const isCustom = hasCustomHours(date, userId);
  
  return isCustom ? <Badge>Custom</Badge> : null;
}
```

### Calculating Hours from Times

```tsx
import { useTimeCalculations } from '@/hooks/timesheet/useTimeCalculations';

function TimeCalculator() {
  const { calculateHours } = useTimeCalculations();
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  
  const hours = calculateHours(startTime, endTime);
  
  return <div>Hours: {hours}</div>;
}
```

## Time Validation

### Validating Time Formats

```tsx
import { isValidTimeFormat } from '@/utils/time/validation';

function TimeInput({ value, onChange }) {
  const [error, setError] = useState('');
  
  const handleChange = (value) => {
    if (value && !isValidTimeFormat(value)) {
      setError('Please enter a valid time (HH:MM)');
    } else {
      setError('');
      onChange(value);
    }
  };
  
  return (
    <div>
      <input value={value} onChange={(e) => handleChange(e.target.value)} />
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

### Validating Time Order

```tsx
import { validateTimeOrder } from '@/utils/time/validation';

function TimeRangeInput() {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (startTime && endTime) {
      const result = validateTimeOrder(startTime, endTime);
      setError(result.valid ? '' : result.message || 'Invalid time range');
    }
  }, [startTime, endTime]);
  
  return (
    <div>
      <input value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      <input value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

## Utility Direct Usage

For simple operations, you can import utility functions directly:

```tsx
import { formatTimeForDisplay } from '@/utils/time/formatting';
import { calculateHoursFromTimes } from '@/utils/time/calculations';

function TimeDisplay({ startTime, endTime }) {
  return (
    <div>
      <p>From {formatTimeForDisplay(startTime)} to {formatTimeForDisplay(endTime)}</p>
      <p>Total: {calculateHoursFromTimes(startTime, endTime)} hours</p>
    </div>
  );
}
```

## Best Practices

1. **Use hooks for component integrations** - Prefer the hook layer over direct utility usage in components
2. **Handle errors gracefully** - Use try/catch when working with validation functions that can throw
3. **Leverage the context providers** for global state - Avoid maintaining duplicate state
4. **Use the timeEntryService directly** only in contexts and hooks - Components should go through hooks
5. **Always validate user input** before processing time calculations
6. **Cache complex calculations** when performance is a concern
