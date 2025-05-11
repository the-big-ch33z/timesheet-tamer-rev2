
import React from 'react';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import TOILSummaryCard from '../TOILSummaryCard';
import { TOILSummary } from '@/types/toil';
import '@testing-library/jest-dom';

// Mock formatDisplayHours
jest.mock('@/utils/time/formatting', () => ({
  formatDisplayHours: (hours: number) => `${hours > 0 ? '+' : ''}${hours}h`
}));

// Mock the hooks
jest.mock('@/utils/time/events/toilEventService', () => ({
  useTOILEvents: () => ({
    subscribe: jest.fn().mockReturnValue(jest.fn()),
    dispatchTOILEvent: jest.fn(),
    lastEvent: null
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
    render(<TOILSummaryCard summary={null} loading={true} monthName="May 2025" />);
    
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
    
    render(<TOILSummaryCard summary={emptySummary} loading={false} monthName="May 2025" />);
    
    // Should show "No TOIL activity" text
    expect(screen.getByText('No TOIL activity for this month.')).toBeInTheDocument();
  });
  
  it('renders valid TOIL summary correctly', () => {
    render(<TOILSummaryCard summary={mockSummary} loading={false} monthName="May 2025" />);
    
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
    
    render(<TOILSummaryCard summary={negativeSummary} loading={false} monthName="May 2025" />);
    
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
    
    render(<TOILSummaryCard 
      summary={invalidSummary} 
      loading={false} 
      monthName="May 2025" 
      onError={onError}
    />);
    
    // Should show error warning
    expect(screen.getByText(/Some TOIL values couldn't be calculated properly/i)).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });
  
  it('renders error fallback for complete failure', () => {
    // Force an error by providing invalid props
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<TOILSummaryCard 
      // @ts-ignore - intentional invalid prop to trigger error
      summary={{ invalid: true }} 
      loading={false} 
      monthName="May 2025" 
    />);
    
    expect(screen.getByText('Error displaying TOIL summary')).toBeInTheDocument();
  });
});
