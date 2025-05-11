
import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '../../__tests__/utils/test-utils';
import TimeEntryManager from '../managers/TimeEntryManager';
import { DraftProvider } from '@/contexts/timesheet/draft-context/DraftContext';
import { TimeEntry } from '@/types';

// Mock the hooks
jest.mock('@/hooks/timesheet/useTimeEntries', () => ({
  useTimeEntries: () => ({
    entries: mockEntries,
    createEntry: jest.fn((entry) => 'new-id-123'),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    calculateTotalHours: jest.fn(() => mockTotalHours),
    refreshEntries: jest.fn()
  })
}));

jest.mock('@/hooks/timesheet/useWorkHours', () => ({
  useWorkHours: () => ({
    saveWorkHoursForDate: jest.fn(),
    getWorkHoursForDate: () => ({
      startTime: '09:00',
      endTime: '17:00',
      isCustom: false
    })
  })
}));

jest.mock('@/hooks/timesheet/useTimeCalculations', () => ({
  useTimeCalculations: () => ({
    calculateHours: jest.fn((start, end) => {
      if (start === '09:00' && end === '17:00') return 8;
      return 0;
    })
  })
}));

// Mock the context trigger
jest.mock('@/contexts/timesheet/TimesheetContext', () => ({
  triggerGlobalSave: jest.fn()
}));

// Mock values for entries
let mockEntries: TimeEntry[] = [];
let mockTotalHours = 0;

// Wrap in necessary providers
const renderWithProviders = (ui: React.ReactElement) => {
  const today = new Date();
  return render(
    <DraftProvider selectedDate={today} userId="user1">
      {ui}
    </DraftProvider>
  );
};

describe('TimeEntryManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEntries = [];
    mockTotalHours = 0;
  });
  
  it('renders with no entries', () => {
    renderWithProviders(
      <TimeEntryManager 
        entries={[]} 
        date={new Date()} 
        interactive={true}
      />
    );
    
    // Should show TimeHeader
    expect(screen.getByText(/Total Hours/i)).toBeInTheDocument();
    
    // Should have no entries in the list
    expect(screen.queryByTestId('entry-list-item')).not.toBeInTheDocument();
    
    // Should have new entry options
    expect(screen.getByText(/add time entry/i, { selector: 'button' })).toBeInTheDocument();
  });
  
  it('displays existing entries', () => {
    // Set up mock entries
    mockEntries = [
      { 
        id: 'entry1', 
        userId: 'user1', 
        date: new Date(),
        hours: 4, 
        description: 'Morning work',
        project: 'Default Project'
      },
      { 
        id: 'entry2', 
        userId: 'user1', 
        date: new Date(),
        hours: 4, 
        description: 'Afternoon work',
        project: 'Default Project'
      }
    ];
    
    mockTotalHours = 8;
    
    renderWithProviders(
      <TimeEntryManager 
        entries={mockEntries} 
        date={new Date()} 
        interactive={true}
      />
    );
    
    // Should show the total hours
    expect(screen.getByText('8.0')).toBeInTheDocument();
    
    // Should show the entry descriptions
    expect(screen.getByText('Morning work')).toBeInTheDocument();
    expect(screen.getByText('Afternoon work')).toBeInTheDocument();
  });
  
  it('shows different UI in non-interactive mode', () => {
    renderWithProviders(
      <TimeEntryManager 
        entries={[]} 
        date={new Date()} 
        interactive={false}
      />
    );
    
    // Should not show new entry options in non-interactive mode
    expect(screen.queryByText(/add time entry/i, { selector: 'button' })).not.toBeInTheDocument();
  });
  
  it('calls onCreateEntry when provided', async () => {
    const mockCreateEntry = jest.fn();
    
    renderWithProviders(
      <TimeEntryManager 
        entries={[]} 
        date={new Date()} 
        interactive={true}
        onCreateEntry={mockCreateEntry}
      />
    );
    
    // TODO: Implement a test that simulates entry creation
    // This requires more complex setup with the draft entry card component
    // In a real test, we would:
    // 1. Find and click the "Add time entry" button
    // 2. Fill out the form
    // 3. Submit the form
    // 4. Verify mockCreateEntry was called with correct params
  });
});
