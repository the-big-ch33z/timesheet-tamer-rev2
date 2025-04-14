# Time Utilities Examples

This document provides practical examples of working with the time utilities library.

## Basic Time Operations

### Format a Time for Display

```tsx
import { formatTimeForDisplay } from '@/utils/time/formatting';

// Convert 24-hour format to 12-hour format with AM/PM
const displayTime = formatTimeForDisplay('14:30'); // "2:30 PM"
```

### Calculate Hours Between Times

```tsx
import { calculateHoursFromTimes } from '@/utils/time/calculations';

// Calculate hours between start and end time
const hours = calculateHoursFromTimes('09:00', '17:30'); // 8.5
```

### Calculate Overtime/Undertime

```tsx
import { calculateHoursVariance, isUndertime } from '@/utils/time/calculations';

// Calculate variance from standard hours
const variance = calculateHoursVariance(8.5, 8); // 0.5
const isUnder = isUndertime(7.5, 8); // true
```

### Validate a Time String

```tsx
import { isValidTimeFormat, validateTimeFormat } from '@/utils/time/validation';

// Check if a string is a valid time format
const isValid = isValidTimeFormat('09:30'); // true

// Validate with error throwing
try {
  validateTimeFormat('25:00', 'Start time');
} catch (error) {
  console.error(error.message); // "Start time has invalid format: 25:00"
}
```

### Check Time Order

```tsx
import { validateTimeOrder } from '@/utils/time/validation';

// Check if end time is after start time
const result = validateTimeOrder('09:00', '17:00');
// { valid: true }

const invalidResult = validateTimeOrder('17:00', '09:00');
// { valid: false, message: "End time must be after start time" }
```

## Working with Time Entries

### Creating a Single Entry

```tsx
import { timeEntryService } from '@/utils/time/services';

const newEntryId = timeEntryService.createEntry({
  userId: 'user-123',
  date: new Date(),
  hours: 8,
  description: 'Development work',
  startTime: '09:00',
  endTime: '17:00'
});

console.log('Created entry:', newEntryId);
```

### Updating an Entry

```tsx
import { timeEntryService } from '@/utils/time/services';

const success = timeEntryService.updateEntry('entry-123', {
  hours: 8.5,
  description: 'Updated description'
});

console.log('Update successful:', success);
```

### Retrieving Entries

```tsx
import { timeEntryService } from '@/utils/time/services';

// Get all entries
const allEntries = timeEntryService.getAllEntries();

// Get entries for a specific user
const userEntries = timeEntryService.getUserEntries('user-123');

// Get entries for a specific day
const today = new Date();
const todaysEntries = timeEntryService.getDayEntries(today, 'user-123');
```

### Calculating Total Hours

```tsx
import { timeEntryService } from '@/utils/time/services';

// Get entries and calculate total hours
const entries = timeEntryService.getUserEntries('user-123');
const totalHours = timeEntryService.calculateTotalHours(entries);

console.log('Total hours worked:', totalHours);
```

## Error Handling

### Using the Time Logger

```tsx
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('MyComponent');

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', new Error('Something went wrong'));
```

### Safe Time Operations

```tsx
import { safeTimeOperation } from '@/utils/time/errors/timeErrorHandling';
import { calculateHoursFromTimes } from '@/utils/time/calculations';

const hours = safeTimeOperation(
  () => calculateHoursFromTimes('09:00', '17:00'),
  0, // Default value if operation fails
  'Calculate work hours' // Operation name for logging
);
```

## Using React Hooks

### Complete Time Entry CRUD Example

```tsx
import { useTimeEntries } from '@/hooks/timesheet/useTimeEntries';
import { useState } from 'react';

function TimeEntryManager({ userId, date }) {
  const { 
    entries, 
    createEntry, 
    updateEntry, 
    deleteEntry, 
    calculateTotalHours
  } = useTimeEntries(userId, date);
  
  const [newEntry, setNewEntry] = useState({
    description: '',
    hours: 0,
    startTime: '',
    endTime: ''
  });
  
  const handleCreateEntry = () => {
    createEntry({
      ...newEntry,
      date,
      userId
    });
    
    // Reset form
    setNewEntry({
      description: '',
      hours: 0,
      startTime: '',
      endTime: ''
    });
  };
  
  const totalHours = calculateTotalHours();
  
  return (
    <div>
      <h2>Time Entries for {date.toDateString()}</h2>
      
      {/* Entry form */}
      <div className="entry-form">
        <input
          value={newEntry.description}
          onChange={e => setNewEntry({...newEntry, description: e.target.value})}
          placeholder="Description"
        />
        {/* Other fields... */}
        <button onClick={handleCreateEntry}>Add Entry</button>
      </div>
      
      {/* Entries list */}
      <div className="entries-list">
        {entries.map(entry => (
          <div key={entry.id} className="entry-item">
            <span>{entry.description}</span>
            <span>{entry.hours} hours</span>
            <button onClick={() => deleteEntry(entry.id)}>Delete</button>
          </div>
        ))}
      </div>
      
      <div className="total-hours">
        Total Hours: {totalHours}
      </div>
    </div>
  );
}
```

### Work Hours Management Example

```tsx
import { useWorkHours } from '@/hooks/timesheet/useWorkHours';
import { useTimeCalculations } from '@/hooks/timesheet/useTimeCalculations';
import { useState, useEffect } from 'react';

function WorkHoursEditor({ date, userId }) {
  const { getWorkHoursForDate, saveWorkHoursForDate, resetWorkHours } = useWorkHours(userId);
  const { calculateHours, validateTimes } = useTimeCalculations();
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [error, setError] = useState('');
  
  // Load initial hours
  useEffect(() => {
    const { startTime: savedStart, endTime: savedEnd } = getWorkHoursForDate(date, userId);
    setStartTime(savedStart);
    setEndTime(savedEnd);
    
    if (savedStart && savedEnd) {
      setCalculatedHours(calculateHours(savedStart, savedEnd));
    }
  }, [date, userId, getWorkHoursForDate, calculateHours]);
  
  // Update hours when times change
  const handleTimeChange = (type, value) => {
    const newStartTime = type === 'start' ? value : startTime;
    const newEndTime = type === 'end' ? value : endTime;
    
    if (type === 'start') setStartTime(value);
    else setEndTime(value);
    
    // Validate time order
    if (newStartTime && newEndTime) {
      const validation = validateTimes(newStartTime, newEndTime);
      setError(validation.valid ? '' : (validation.message || 'Invalid time range'));
      
      if (validation.valid) {
        const hours = calculateHours(newStartTime, newEndTime);
        setCalculatedHours(hours);
      }
    }
  };
  
  // Save work hours
  const handleSave = () => {
    if (error) return;
    
    saveWorkHoursForDate(date, startTime, endTime, userId);
    // Show success message
  };
  
  // Reset to default hours
  const handleReset = () => {
    resetWorkHours(date, userId);
    setStartTime('');
    setEndTime('');
    setCalculatedHours(0);
    setError('');
  };
  
  return (
    <div className="work-hours-editor">
      <div className="time-inputs">
        <div>
          <label>Start Time</label>
          <input
            value={startTime}
            onChange={e => handleTimeChange('start', e.target.value)}
            placeholder="HH:MM"
          />
        </div>
        <div>
          <label>End Time</label>
          <input
            value={endTime}
            onChange={e => handleTimeChange('end', e.target.value)}
            placeholder="HH:MM"
          />
        </div>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <div className="calculated-hours">
        Hours: {calculatedHours.toFixed(1)}
      </div>
      
      <div className="actions">
        <button onClick={handleSave} disabled={!!error}>Save</button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}
```

## Advanced Use Cases

### Handling Overnight Shifts

```tsx
import { calculateHoursFromTimes } from '@/utils/time/calculations';

// Calculate hours for an overnight shift
const nightShiftHours = calculateHoursFromTimes('22:00', '06:00'); // 8 hours
```

### Working with Multiple Users' Schedules

```tsx
import { useWorkHours } from '@/hooks/timesheet/useWorkHours';

function TeamSchedule({ date, teamMembers }) {
  const { getWorkHoursForDate } = useWorkHours();
  
  return (
    <div className="team-schedule">
      <h2>Team Schedule for {date.toDateString()}</h2>
      <table>
        <thead>
          <tr>
            <th>Team Member</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Hours</th>
          </tr>
        </thead>
        <tbody>
          {teamMembers.map(member => {
            const { startTime, endTime, calculatedHours } = 
              getWorkHoursForDate(date, member.id);
              
            return (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{startTime || 'Not set'}</td>
                <td>{endTime || 'Not set'}</td>
                <td>{calculatedHours || 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

For more examples and detailed usage, refer to the test files in each module directory.
