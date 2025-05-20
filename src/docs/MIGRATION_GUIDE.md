
# Migration Guide: Unified TOIL System

This guide explains how to migrate from the legacy TOIL components to the new unified TOIL system. The new system offers better performance, improved error handling, and consistent typing.

## Why Migrate?

The unified TOIL system provides these advantages:

- **Centralized event handling** - All events use a common EventBus
- **Type safety** - TypeScript interfaces ensure proper data structure
- **Simplified API** - Single hook providing all functionality
- **Performance improvements** - Optimized rendering and calculation
- **Better error handling** - Consistent error propagation and reporting

## Migration Steps

### Step 1: Replace Legacy Hooks with useUnifiedTOIL

**Before:**
```typescript
// Old approach with multiple hooks
const { toilSummary, isLoading } = useTOILSummary(userId, date);
const { calculateTOIL } = useTOILCalculation(userId, date, entries);
const { isActive } = useTOILState(userId);
```

**After:**
```typescript
// New unified approach
import { useUnifiedTOIL } from "@/hooks/timesheet/toil/useUnifiedTOIL";

const {
  toilSummary,
  isLoading,
  calculateToilForDay,
  triggerTOILCalculation,
  refreshSummary,
  isToilEntry
} = useUnifiedTOIL({
  userId,
  date,
  entries,
  workSchedule,
  options: {
    monthOnly: false,  // Set to true for monthly summary only
    autoRefresh: true  // Enable automatic refreshing
  }
});
```

### Step 2: Update Event Handling

**Before:**
```typescript
// Old event handling
useEffect(() => {
  const handleTOILUpdate = (e) => {
    if (e.detail?.userId === userId) {
      refreshData();
    }
  };
  
  window.addEventListener('toil:updated', handleTOILUpdate);
  
  return () => {
    window.removeEventListener('toil:updated', handleTOILUpdate);
  };
}, [userId]);
```

**After:**
```typescript
// New event handling with EventBus
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS, TOILEventData } from '@/utils/events/eventTypes';

useEffect(() => {
  const subscription = eventBus.subscribe(
    TOIL_EVENTS.UPDATED, 
    (data: TOILEventData) => {
      if (data.userId === userId) {
        refreshData();
      }
    }
  );
  
  return () => subscription();
}, [userId]);
```

### Step 3: Publishing Events

**Before:**
```typescript
// Old event dispatch
const event = new CustomEvent('toil:calculated', {
  detail: { userId, date: date.toISOString() }
});
window.dispatchEvent(event);
```

**After:**
```typescript
// New event publish
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS, TOILEventData } from '@/utils/events/eventTypes';

eventBus.publish(TOIL_EVENTS.CALCULATED, {
  userId,
  date: date.toISOString(),
  timestamp: Date.now(),
  source: 'MyComponent',
  status: 'completed'
} as TOILEventData);
```

### Step 4: Using TOILSummaryCard

**Before:**
```typescript
<TOILCard 
  userId={userId} 
  month={currentMonth} 
  onUpdate={handleTOILUpdate} 
/>
```

**After:**
```typescript
<TOILSummaryCard
  userId={userId}
  date={currentMonth}
  monthName={format(currentMonth, 'MMMM yyyy')}
  onError={handleTOILError}
  showRollover={true}
  rolloverHours={rolloverHours}
  useSimpleView={false}
/>
```

### Step 5: Working with Calendar Updates

The calendar now listens for specific calendar refresh events. To trigger a calendar update:

```typescript
import { eventBus } from '@/utils/events/EventBus';
import { TOIL_EVENTS, TOILEventData } from '@/utils/events/eventTypes';

// Notify the calendar to refresh
const notifyCalendarUpdate = () => {
  eventBus.publish(TOIL_EVENTS.CALENDAR_REFRESH, {
    userId,
    date: selectedDate.toISOString(),
    timestamp: Date.now(),
    source: 'MyComponent' 
  } as TOILEventData, {
    debounce: 100 // Optional debouncing
  });
};
```

## Common Issues During Migration

### 1. Type Errors

If you encounter type errors, make sure you're importing the `TOILEventData` interface:

```typescript
import { TOILEventData } from '@/utils/events/eventTypes';
```

### 2. Missing Events

If events aren't propagating, check:
- Event name is correct (use constants from `TOIL_EVENTS`)
- User ID is included in event data
- Subscription is correctly set up

### 3. Multiple Updates

If components update too frequently:
- Use the `debounce` option when publishing events
- Consider using memo on components
- Check equality comparisons in useEffect dependencies

### 4. Legacy Components

For components that can't be migrated immediately:
- Use the bridge pattern in the documentation
- Add adapter functions that convert between systems

## Examples of Migrated Components

See these files for examples of migrated components:
- `src/components/timesheet/detail/components/TOILSummaryCard.tsx`
- `src/components/timesheet/detail/WorkHoursSection.tsx`
- `src/components/timesheet/calendar/CalendarGrid.tsx`

## Testing After Migration

After migrating, test these scenarios:
1. TOIL calculations trigger calendar updates
2. Summary cards refresh when TOIL changes
3. Error handling works properly
4. Performance is improved

## Need Help?

If you encounter issues while migrating, check the debug logs or add console.log statements with the pattern:

```typescript
console.log(`[ComponentName] Event received:`, data);
```

This will help trace the flow of events through the system.
