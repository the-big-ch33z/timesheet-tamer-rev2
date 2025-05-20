
# TOIL Event System Documentation

## Overview

This document provides comprehensive information about the Time Off In Lieu (TOIL) event system, its integration with components, and the data flow between different parts of the application.

## Event Types

All TOIL-related events are centralized in `src/utils/events/eventTypes.ts` under the `TOIL_EVENTS` constant. The main events are:

| Event Name | Description | Purpose |
|------------|-------------|---------|
| `UPDATED` | General TOIL data changed | Notifies when any TOIL data is modified |
| `SUMMARY_UPDATED` | TOIL summary data updated | Specific to summary updates (monthly totals) |
| `CALCULATED` | TOIL calculation completed | Fired when a day's TOIL is calculated |
| `CALENDAR_REFRESH` | Trigger calendar refresh | Direct signal to update calendar visualization |
| `DAY_DATA_UPDATED` | Specific day's data updated | For targeted updates of individual days |

## Event Data Structure

TOIL events use the `TOILEventData` interface which includes:

```typescript
interface TOILEventData {
  userId?: string;           // User the event applies to
  date?: string;             // Date in ISO format
  timestamp?: number;        // When the event occurred
  source?: string;           // Component that triggered the event
  requiresRefresh?: boolean; // Whether UI refresh is needed
  detail?: {                 // Additional nested data
    userId?: string;         // For legacy support
  };
  status?: 'starting' | 'completed' | 'error'; // For calculation events
  summary?: any;             // TOIL summary data
  error?: string;            // Error information
}
```

## Component Communication Flow

The TOIL event system enables communication between these key components:

1. **WorkHoursSection** → Initiates TOIL calculations and sends events
2. **CalendarGrid** → Subscribes to events to update day visuals
3. **TOILSummaryCard** → Displays and refreshes TOIL summary data
4. **MonthlyHours** → Shows monthly aggregated TOIL information

```
┌─────────────────┐     ┌───────────────┐     ┌─────────────────┐
│ WorkHoursSection│────▶│   EventBus    │────▶│   CalendarGrid  │
└─────────────────┘     └───────────────┘     └─────────────────┘
        │                       ▲                      │
        │                       │                      │
        ▼                       │                      ▼
┌─────────────────┐             │             ┌─────────────────┐
│   useUnifiedTOIL│─────────────┘             │  CalendarDay    │
└─────────────────┘                           └─────────────────┘
        │                                            ▲
        │                                            │
        ▼                                            │
┌─────────────────┐             ┌─────────────────┐ │
│ TOILSummaryCard │◀────────────│  MonthlyHours   │─┘
└─────────────────┘             └─────────────────┘
```

## Best Practices for Using TOIL Events

1. **Always include userId** - This enables proper filtering of events
2. **Set source property** - Helps with debugging and tracing event flow
3. **Use proper event types** - Choose the most specific event type
4. **Consider debouncing** - For high-frequency updates
5. **Handle cleanup** - Always unsubscribe from events when components unmount

## Example: Triggering a TOIL Calculation

```typescript
// In a component that needs to trigger TOIL calculation
const triggerCalculation = () => {
  eventBus.publish(TOIL_EVENTS.CALCULATED, {
    userId: currentUser.id,
    date: selectedDate.toISOString(),
    status: 'starting',
    timestamp: Date.now(),
    source: 'MyComponent'
  } as TOILEventData);
  
  // ... perform calculation
  
  // Then publish completion
  eventBus.publish(TOIL_EVENTS.CALCULATED, {
    userId: currentUser.id,
    date: selectedDate.toISOString(),
    status: 'completed',
    timestamp: Date.now(),
    source: 'MyComponent',
    requiresRefresh: true
  } as TOILEventData);
};
```

## Example: Listening for TOIL Events

```typescript
// In a component that needs to react to TOIL changes
useEffect(() => {
  const subscription = eventBus.subscribe(
    TOIL_EVENTS.CALENDAR_REFRESH, 
    (data: TOILEventData) => {
      if (data?.userId === currentUser.id) {
        // Handle the event
        refreshDisplay();
      }
    }
  );
  
  return () => subscription(); // Clean up
}, [currentUser.id]);
```

## Migration from Legacy Event Handling

If you're working with components still using the old event system, you can bridge them using:

```typescript
// Legacy DOM event listener
window.addEventListener('toil:calculated', (e) => {
  const customEvent = e as CustomEvent;
  const data = customEvent.detail as TOILEventData;
  
  // Convert to new event system
  eventBus.publish(TOIL_EVENTS.CALCULATED, data);
});
```

## Performance Considerations

- Use the `throttle` and `debounce` options when publishing events that might fire frequently
- Consider adding the `deduplicate` option for events where identical sequential payloads should be combined
- Use selective event filtering by checking userId and other relevant fields

## Troubleshooting

If events aren't propagating correctly:

1. Check that the event type is correct
2. Verify that userId matching is working
3. Look for typos in event names
4. Enable debug logging with console.log statements
5. Use the EventBus debug methods: `eventBus.getEventHistory()`
