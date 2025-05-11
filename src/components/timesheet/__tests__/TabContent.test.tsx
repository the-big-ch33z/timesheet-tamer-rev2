
import React from 'react';
import { render } from './utils/test-utils';
import './utils/setupTests'; // Import the setup file for Jest DOM matchers
import TabContent from '../TabContent';
import { useCalendarContext, useUserTimesheetContext, useTimeEntryContext } from '@/contexts/timesheet';
import { screen } from './utils/test-utils';

// Mock the hooks
jest.mock('@/contexts/timesheet', () => ({
  useCalendarContext: jest.fn(),
  useUserTimesheetContext: jest.fn(),
  useTimeEntryContext: jest.fn(),
}));

// Mock the nested components to avoid testing their implementation
jest.mock('../TimesheetCalendar', () => () => <div data-testid="timesheet-calendar">Calendar Mock</div>);
jest.mock('../detail/WorkHoursSection', () => () => <div data-testid="work-hours-section">Work Hours Mock</div>);
jest.mock('../MonthlyHours', () => () => <div data-testid="monthly-hours">Monthly Hours Mock</div>);
jest.mock('../ToilSummary', () => () => <div data-testid="toil-summary">TOIL Summary Mock</div>);
jest.mock('../RecentEntries', () => () => <div data-testid="recent-entries">Recent Entries Mock</div>);

describe('TabContent', () => {
  beforeEach(() => {
    // Setup default mock hook values
    (useCalendarContext as jest.Mock).mockReturnValue({
      currentMonth: new Date(),
      selectedDay: new Date(),
      prevMonth: jest.fn(),
      nextMonth: jest.fn(),
      handleDayClick: jest.fn(),
    });
    
    (useUserTimesheetContext as jest.Mock).mockReturnValue({
      viewedUser: { id: 'user-1', name: 'Test User' },
      workSchedule: {},
      canEditTimesheet: true,
    });
    
    (useTimeEntryContext as jest.Mock).mockReturnValue({
      entries: [],
      createEntry: jest.fn(),
      getDayEntries: jest.fn().mockReturnValue([]),
    });
  });

  test('renders timesheet view when activeTab is "timesheet"', () => {
    render(<TabContent />);
    
    // Verify calendar component is rendered
    expect(screen.getByTestId('timesheet-calendar')).toBeInTheDocument();
    
    // Verify work hours section is rendered when selectedDay is defined
    expect(screen.getByTestId('work-hours-section')).toBeInTheDocument();
    
    // Verify monthly hours and TOIL summary are rendered
    expect(screen.getByTestId('monthly-hours')).toBeInTheDocument();
    expect(screen.getByTestId('toil-summary')).toBeInTheDocument();
  });

  test('does not render work hours section when selectedDay is null', () => {
    (useCalendarContext as jest.Mock).mockReturnValue({
      currentMonth: new Date(),
      selectedDay: null,
      prevMonth: jest.fn(),
      nextMonth: jest.fn(),
      handleDayClick: jest.fn(),
    });
    
    render(<TabContent />);
    
    // Verify calendar component is still rendered
    expect(screen.getByTestId('timesheet-calendar')).toBeInTheDocument();
    
    // Work hours section should not be rendered
    expect(screen.queryByTestId('work-hours-section')).not.toBeInTheDocument();
  });
});
