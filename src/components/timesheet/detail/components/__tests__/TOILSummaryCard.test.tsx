
import React from 'react';
import { render } from '@testing-library/react';
import { screen } from '../../../__tests__/utils/test-utils';
import TOILSummaryCard from '../TOILSummaryCard';
import { TOILSummary } from '@/types/toil';
import '@testing-library/jest-dom';

// Mock formatDisplayHours
jest.mock('@/utils/time/formatting', () => ({
  formatDisplayHours: (hours: number) => `${hours > 0 ? '+' : ''}${hours}h`
}));

// Mock the unified TOIL hook
jest.mock('@/hooks/timesheet/toil/useUnifiedTOIL', () => ({
  useUnifiedTOIL: jest.fn(({ options = {} }) => {
    // Extract the test-specific mock data from options
    const testProps = options.testProps || {};
    
    return {
      toilSummary: testProps.summary || null,
      isLoading: testProps.loading !== undefined ? testProps.loading : false,
      error: null,
      isCalculating: false,
      calculateToilForDay: jest.fn().mockResolvedValue({}),
      triggerTOILCalculation: jest.fn().mockResolvedValue({}),
      isToilEntry: jest.fn(),
      refreshSummary: jest.fn()
    };
  })
}));

describe('TOILSummaryCard', () => {
  const mockSummary: TOILSummary = {
    userId: 'test-user-1',
    monthYear: '2025-05',
    accrued: 10,
    used: 4,
    remaining: 6
  };

  it('renders loading state correctly', () => {
    render(
      <TOILSummaryCard 
        userId="test-user-1" 
        date={new Date('2025-05-15')}
        monthName="May 2025"
        testProps={{ summary: null, loading: true }}
      />
    );
    
    // Should show loading indicators
    expect(screen.getAllByTestId('loading-indicator')).toHaveLength(3);
  });
  
  it('renders no TOIL activity state correctly', () => {
    const emptySummary: TOILSummary = {
      userId: 'test-user-1',
      monthYear: '2025-05',
      accrued: 0,
      used: 0,
      remaining: 0
    };
    
    render(
      <TOILSummaryCard 
        userId="test-user-1" 
        date={new Date('2025-05-15')}
        monthName="May 2025"
        testProps={{ summary: emptySummary, loading: false }}
      />
    );
    
    // Should show "No TOIL activity" text
    expect(screen.getByText('No TOIL activity for this month.')).toBeInTheDocument();
  });
  
  it('renders valid TOIL summary correctly', () => {
    render(
      <TOILSummaryCard 
        userId="test-user-1" 
        date={new Date('2025-05-15')}
        monthName="May 2025"
        testProps={{ summary: mockSummary, loading: false }}
      />
    );
    
    // Check for correct values
    expect(screen.getByText('Earned')).toBeInTheDocument();
    expect(screen.getByText('+10h')).toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
    expect(screen.getByText('-4h')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
    expect(screen.getByText('+6h')).toBeInTheDocument();
  });
  
  it('handles negative balance correctly', () => {
    const negativeSummary: TOILSummary = {
      userId: 'test-user-1',
      monthYear: '2025-05',
      accrued: 4,
      used: 10,
      remaining: -6
    };
    
    render(
      <TOILSummaryCard 
        userId="test-user-1" 
        date={new Date('2025-05-15')}
        monthName="May 2025"
        testProps={{ summary: negativeSummary, loading: false }}
      />
    );
    
    // Check for negative balance warning
    expect(screen.getByText('Negative TOIL balance')).toBeInTheDocument();
    expect(screen.getByText('-6h')).toBeInTheDocument();
  });
  
  it('handles invalid data gracefully', () => {
    const invalidSummary = {
      userId: 'test-user-1',
      monthYear: '2025-05',
      accrued: NaN,
      used: 4,
      remaining: 6
    } as TOILSummary;
    
    const onError = jest.fn();
    
    render(
      <TOILSummaryCard 
        userId="test-user-1" 
        date={new Date('2025-05-15')}
        monthName="May 2025" 
        onError={onError}
        testProps={{ summary: invalidSummary, loading: false }}
      />
    );
    
    // Should show error warning
    expect(screen.getByText(/Some TOIL values couldn't be calculated properly/i)).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });
  
  it('renders error fallback for complete failure', () => {
    // Force an error by providing invalid props
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <TOILSummaryCard 
        userId="test-user-1" 
        date={new Date('2025-05-15')}
        monthName="May 2025" 
        testProps={{ summary: { invalid: true } as any, loading: false }}
      />
    );
    
    expect(screen.getByText('Error displaying TOIL summary')).toBeInTheDocument();
  });
});
