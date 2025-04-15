
import React from 'react';
import { render, screen } from '@testing-library/react';
import MonthlyHours from '../MonthlyHours';
import { useTimesheetData } from '@/hooks/timesheet/useTimesheetData';
import { useUserMetrics } from '@/contexts/user-metrics';
import { createTestEntry } from '@/utils/testing/mockUtils';

// Mock the hooks
jest.mock('@/hooks/timesheet/useTimesheetData', () => ({
  useTimesheetData: jest.fn()
}));

jest.mock('@/contexts/user-metrics', () => ({
  useUserMetrics: jest.fn()
}));

describe('MonthlyHours Component', () => {
  const mockUser = { 
    id: 'user1', 
    name: 'Test User',
    email: 'test@example.com',
    role: 'team-member'
  };
  const mockDate = new Date('2025-04-15');
  
  beforeEach(() => {
    (useTimesheetData as jest.Mock).mockReturnValue({
      entries: [],
      getDayEntries: jest.fn(),
      getMonthEntries: jest.fn(),
      calculateTotalHours: jest.fn()
    });

    (useUserMetrics as jest.Mock).mockReturnValue({
      getUserMetrics: jest.fn().mockReturnValue({
        fte: 1,
        fortnightHours: 76
      })
    });
  });

  it('renders with no entries', () => {
    render(
      <MonthlyHours 
        user={mockUser}
        currentMonth={mockDate}
      />
    );

    expect(screen.getByText('Monthly Hours')).toBeInTheDocument();
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  it('displays correct hours for entries', () => {
    const mockEntries = [
      createTestEntry({ userId: 'user1', hours: 4 }),
      createTestEntry({ userId: 'user1', hours: 4 })
    ];

    (useTimesheetData as jest.Mock).mockReturnValue({
      entries: mockEntries,
      calculateTotalHours: () => 8
    });

    render(
      <MonthlyHours 
        user={mockUser}
        currentMonth={mockDate}
      />
    );

    expect(screen.getByText('8.0')).toBeInTheDocument();
  });

  it('shows FTE information when available', () => {
    render(
      <MonthlyHours 
        user={mockUser}
        currentMonth={mockDate}
      />
    );

    expect(screen.getByText(/FTE: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Required hours\/fortnight: 76/)).toBeInTheDocument();
  });

  it('updates progress bar correctly', () => {
    const mockEntries = [
      createTestEntry({ userId: 'user1', hours: 38 }),
      createTestEntry({ userId: 'user1', hours: 38 })
    ];

    (useTimesheetData as jest.Mock).mockReturnValue({
      entries: mockEntries,
      calculateTotalHours: () => 76
    });

    render(
      <MonthlyHours 
        user={mockUser}
        currentMonth={mockDate}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });
});
