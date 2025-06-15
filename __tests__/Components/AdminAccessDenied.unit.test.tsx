import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminAccessDenied from '@/components/error/admin-access-denied/page';

// Mock the next/navigation router with a named mock function
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  AlertOctagon: () => <div data-testid="alert-octagon-icon">AlertOctagon Icon</div>,
  Mail: () => <div data-testid="mail-icon">Mail Icon</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft Icon</div>,
}));

// Mock the UI components
jest.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant }: any) => (
    <button 
      onClick={onClick} 
      className={className} 
      data-variant={variant}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

jest.mock('../../src/components/ui/alert', () => ({
  Alert: ({ children, className, variant }: any) => (
    <div className={className} data-variant={variant} data-testid="alert">
      {children}
    </div>
  ),
  AlertTitle: ({ children, className }: any) => (
    <div className={className} data-testid="alert-title">
      {children}
    </div>
  ),
  AlertDescription: ({ children, className }: any) => (
    <div className={className} data-testid="alert-description">
      {children}
    </div>
  ),
}));

// Mock the window.location.href assignment
const originalWindow = { ...window };
const originalLocation = window.location;

beforeAll(() => {
  // Define a partial mock of the Location object
  const mockLocation = {
    ...originalLocation,
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    toString: jest.fn(() => originalLocation.toString()),
  };
  
  // Override the window.location getter
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: mockLocation,
    writable: true,
  });
});

afterAll(() => {
  // Restore the original window.location
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
    writable: true,
  });
});

describe('AdminAccessDenied Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    pushMock.mockClear();
    window.location.href = '';
  });
  
  it('renders correctly with all elements', () => {
    render(<AdminAccessDenied />);
    
    // Check main heading and subheading
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText("Oops! Something's Not Quite Right")).toBeInTheDocument();
    
    // Check alert message
    expect(screen.getByTestId('alert')).toBeInTheDocument();
    expect(screen.getByText('Access Restriction Notice')).toBeInTheDocument();
    
    // Check for role incompatibility message (specific to AdminAccessDenied)
    expect(screen.getByText(/You cannot access this page due to role incompatibility/i)).toBeInTheDocument();
    
    // Check icons are present
    expect(screen.getAllByTestId('alert-octagon-icon').length).toBeGreaterThan(0);
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    
    // Check button text
    expect(screen.getByText('Go To Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    
    // Check help text
    expect(screen.getByText(/If you believe this is a mistake or need immediate assistance/i)).toBeInTheDocument();
    expect(screen.getByText('ITF.shared.services@tugu.com')).toBeInTheDocument();
  });
  
  it('navigates to dashboard when "Go To Dashboard" is clicked', () => {
    render(<AdminAccessDenied />);
    
    const dashboardButton = screen.getByText('Go To Dashboard').closest('button');
    fireEvent.click(dashboardButton!);
    
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
  
  it('opens email client when "Contact Support" is clicked', () => {
    render(<AdminAccessDenied />);
    
    const supportButton = screen.getByText('Contact Support').closest('button');
    fireEvent.click(supportButton!);
    
    expect(window.location.href).toBe('mailto:ITF.shared.services@tugu.com');
  });
  
  it('applies the correct styles and variants to components', () => {
    render(<AdminAccessDenied />);
    
    // Check the alert has the correct variant
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveAttribute('data-variant', 'destructive');
    expect(alert).toHaveClass('bg-yellow-50');
    expect(alert).toHaveClass('border-yellow-200');
    
    // Check the dashboard button has the outline variant
    const buttons = screen.getAllByTestId('button');
    const dashboardButton = buttons.find(button => 
      button.textContent?.includes('Go To Dashboard')
    );
    expect(dashboardButton).toHaveAttribute('data-variant', 'outline');
    
    // Check the contact support button has the correct background class
    const supportButton = buttons.find(button => 
      button.textContent?.includes('Contact Support')
    );
    expect(supportButton).toHaveClass('bg-blue-600');
    expect(supportButton).toHaveClass('hover:bg-blue-700');
  });
  
  it('has the correct layout structure', () => {
    const { container } = render(<AdminAccessDenied />);
    
    // Check main container
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(container.querySelector('.flex.flex-col.items-center.justify-center')).toBeInTheDocument();
    
    // Check content layout
    expect(container.querySelector('.max-w-2xl.w-full.space-y-8')).toBeInTheDocument();
    
    // Check warning icon container
    expect(container.querySelector('.bg-yellow-100.p-3.rounded-full')).toBeInTheDocument();
    
    // Check title section
    expect(container.querySelector('.text-center.space-y-2')).toBeInTheDocument();
    
    // Check buttons container responsive layout
    const buttonsContainer = container.querySelector('.flex.flex-col.sm\\:flex-row.gap-4.justify-center');
    expect(buttonsContainer).toBeInTheDocument();
  });
  
  it('shows correct error message for admin role restriction', () => {
    render(<AdminAccessDenied />);
    
    // Check specifically for the admin-specific role error message
    const alertDescription = screen.getByTestId('alert-description');
    expect(alertDescription).toHaveTextContent(/role incompatibility/i);
    expect(alertDescription).toHaveTextContent(/contact the Shared Service Department/i);
  });
  
  it('renders email link with correct styling', () => {
    const { container } = render(<AdminAccessDenied />);
    
    // Check that the email is styled correctly
    const emailLink = screen.getByText('ITF.shared.services@tugu.com');
    expect(emailLink).toHaveClass('text-blue-600');
  });
});