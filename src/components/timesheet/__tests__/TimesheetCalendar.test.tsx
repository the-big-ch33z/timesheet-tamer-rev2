
import React from 'react';
import { render } from './utils/test-utils';
import './utils/setupTests'; // Import the setup file for Jest DOM matchers
import TimesheetCalendar from '../TimesheetCalendar';
import { format } from 'date-fns';
import { screen, fireEvent } from './utils/test-utils';

// Mock props
const mockProps = {
  currentMonth: new Date(),
  entries: [],
  onPrevMonth: jest.fn(),
  onNextMonth: jest.fn(),
  onDayClick: jest.fn(),
  workSchedule: undefined,
  userId: 'test-user-id', // Add a mock userId
};

describe('TimesheetCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the current month name and year', () => {
    render(<TimesheetCalendar {...mockProps} />);
    const monthTitle = screen.getByText(format(mockProps.currentMonth, 'MMMM yyyy'));
    expect(monthTitle).toBeInTheDocument();
  });

  test('calls onPrevMonth when previous month button is clicked', () => {
    render(<TimesheetCalendar {...mockProps} />);
    const prevButton = screen.getByLabelText('Previous month');
    fireEvent.click(prevButton);
    expect(mockProps.onPrevMonth).toHaveBeenCalled();
  });

  test('calls onNextMonth when next month button is clicked', () => {
    render(<TimesheetCalendar {...mockProps} />);
    const nextButton = screen.getByLabelText('Next month');
    fireEvent.click(nextButton);
    expect(mockProps.onNextMonth).toHaveBeenCalled();
  });

  test('displays weekday headers', () => {
    render(<TimesheetCalendar {...mockProps} />);
    expect(screen.getByText('Su')).toBeInTheDocument();
    expect(screen.getByText('Mo')).toBeInTheDocument();
    expect(screen.getByText('Tu')).toBeInTheDocument();
    expect(screen.getByText('We')).toBeInTheDocument();
    expect(screen.getByText('Th')).toBeInTheDocument();
    expect(screen.getByText('Fr')).toBeInTheDocument();
    expect(screen.getByText('Sa')).toBeInTheDocument();
  });
});
