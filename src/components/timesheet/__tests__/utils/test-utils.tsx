
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TimesheetProvider } from '@/contexts/timesheet';
import { AuthProvider } from '@/contexts/auth';
import { WorkScheduleProvider } from '@/contexts/work-schedule';
import { TimesheetSettingsProvider } from '@/contexts/TimesheetSettingsContext';
import { UserMetricsProvider } from '@/contexts/user-metrics';

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

// Override render method
export { customRender as render };
