import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '../../__tests__/utils/test-utils';
import { WorkHoursInterface } from '../work-hours';

// Mock useWorkHours hook
jest.mock('@/hooks/timesheet/useWorkHours', () => ({
  useWorkHours: () => ({
    getWorkHoursForDate: jest.fn((date) => ({
      startTime: '09:00',
      endTime: '17:00',
      isCustom: false 
    })),
    saveWorkHoursForDate: jest.fn(),
    resetWorkHours: jest.fn(),
    hasCustomHours: jest.fn(() => false)
  })
}));

// Mock useTimeCalculations hook
jest.mock('@/hooks/timesheet/useTimeCalculations', () => ({
  useTimeCalculations: () => ({
    calculateHours: jest.fn((start, end) => {
      if (start === '09:00' && end === '17:00') return 8;
      return 0;
    })
  })
}));

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock logger
jest.mock('@/utils/time/errors', () => ({
  createTimeLogger: () => ({
    debug: jest.fn(),
    error: jest.fn()
  })
}));

describe('WorkHoursInterface Component', () => {
  const mockDate = new Date();
  const mockUserId = 'test-user';
  const mockEntries = []; // Add empty entries array for all tests
  
  it('renders with default props', () => {
    render(<WorkHoursInterface date={mockDate} userId={mockUserId} entries={mockEntries} />);
    
    expect(screen.getByText('Work Hours')).toBeInTheDocument();
    expect(screen.getByText('Start Time')).toBeInTheDocument();
    expect(screen.getByText('End Time')).toBeInTheDocument();
    
    // Should show hours
    expect(screen.getByText('Hours: 8.0')).toBeInTheDocument();
  });
  
  it('renders custom hours with reset button', () => {
    // Override the mock for this test
    jest.spyOn(require('@/hooks/timesheet/useWorkHours'), 'useWorkHours').mockImplementation(() => ({
      getWorkHoursForDate: jest.fn(() => ({ 
        startTime: '08:00', 
        endTime: '16:00', 
        isCustom: true 
      })),
      saveWorkHoursForDate: jest.fn(),
      resetWorkHours: jest.fn(),
      hasCustomHours: jest.fn(() => true)
    }));
    
    render(<WorkHoursInterface date={mockDate} userId={mockUserId} entries={mockEntries} />);
    
    // Should show custom indicator
    expect(screen.getByText('Work Hours (Custom)')).toBeInTheDocument();
    
    // Should show reset button
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });
  
  it('handles reset action', () => {
    // Mock with custom hours to show reset button
    const mockResetWorkHours = jest.fn();
    jest.spyOn(require('@/hooks/timesheet/useWorkHours'), 'useWorkHours').mockImplementation(() => ({
      getWorkHoursForDate: jest.fn(() => ({ 
        startTime: '08:00', 
        endTime: '16:00', 
        isCustom: true 
      })),
      saveWorkHoursForDate: jest.fn(),
      resetWorkHours: mockResetWorkHours,
      hasCustomHours: jest.fn(() => true)
    }));
    
    render(<WorkHoursInterface date={mockDate} userId={mockUserId} entries={mockEntries} />);
    
    // Click the reset button
    fireEvent.click(screen.getByText('Reset'));
    
    // Should call resetWorkHours
    expect(mockResetWorkHours).toHaveBeenCalledWith(mockDate, mockUserId);
  });
  
  it('disables interactions in non-interactive mode', () => {
    render(<WorkHoursInterface date={mockDate} userId={mockUserId} entries={mockEntries} interactive={false} />);
    
    // In non-interactive mode, inputs should be disabled
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).toHaveAttribute('disabled');
    });
    
    // Reset button should not be present
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();
  });
  
  it('calls onHoursChange when hours change', () => {
    const onHoursChange = jest.fn();
    
    render(
      <WorkHoursInterface 
        date={mockDate} 
        userId={mockUserId}
        entries={mockEntries}
        onHoursChange={onHoursChange}
      />
    );
    
    // onHoursChange should be called with initial hours
    expect(onHoursChange).toHaveBeenCalledWith(8);
  });
});
