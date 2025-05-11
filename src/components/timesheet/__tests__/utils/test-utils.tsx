
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { TimesheetProvider } from '@/contexts/timesheet';
import { AuthProvider } from '@/contexts/auth';
import { WorkScheduleProvider } from '@/contexts/work-schedule';
import { TimesheetSettingsProvider } from '@/contexts/TimesheetSettingsContext';
import { UserMetricsProvider } from '@/contexts/user-metrics';

// Import these specifically from testing-library/dom which has them
import { screen, fireEvent, waitFor } from '@testing-library/dom';

// Custom renderer that includes all providers needed for timesheet components
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <BrowserRouter>
        <AuthProvider>
          <WorkScheduleProvider>
            <TimesheetSettingsProvider>
              <UserMetricsProvider>
                <TimesheetProvider>
                  {children}
                </TimesheetProvider>
              </UserMetricsProvider>
            </TimesheetSettingsProvider>
          </WorkScheduleProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };
  
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
// Explicitly export the testing utilities 
export { screen, fireEvent, waitFor };
export { customRender as render };
