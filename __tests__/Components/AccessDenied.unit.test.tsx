import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccessDenied from '@/components/error/access-denied/page';

// Mock the next/navigation router
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

describe('AccessDenied Component', () => {
  it('renders correctly with all elements', () => {
    render(<AccessDenied />);
    
    // Check main heading and subheading
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText("Oops! Something's Not Quite Right")).toBeInTheDocument();
    
    // Check alert message
    expect(screen.getByTestId('alert')).toBeInTheDocument();
    expect(screen.getByText('Access Restriction Notice')).toBeInTheDocument();
    expect(screen.getByText(/You cannot access this page due to status incompatibility/i)).toBeInTheDocument();
    
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
    pushMock.mockClear(); // Clear any previous calls
    render(<AccessDenied />);
    
    const dashboardButton = screen.getByText('Go To Dashboard').closest('button');
    fireEvent.click(dashboardButton!);
    
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
  
  it('opens email client when "Contact Support" is clicked', () => {
    render(<AccessDenied />);
    
    const supportButton = screen.getByText('Contact Support').closest('button');
    fireEvent.click(supportButton!);
    
    expect(window.location.href).toBe('mailto:ITF.shared.services@tugu.com');
  });
  
  it('applies the correct styles and variants to components', () => {
    render(<AccessDenied />);
    
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
    const { container } = render(<AccessDenied />);
    
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
  
  it('contains the expected accessibility features', () => {
    const { container } = render(<AccessDenied />);
    
    // Check for semantic heading elements
    expect(container.querySelector('h1')).toBeInTheDocument();
    expect(container.querySelector('h1')?.textContent).toBe('Access Denied');
    
    // Check that alert-octagon icon is rendered
    expect(screen.getAllByTestId('alert-octagon-icon').length).toBeGreaterThan(0);
    
    // Check that the large icon container exists
    const iconContainer = container.querySelector('.bg-yellow-100.p-3.rounded-full');
    expect(iconContainer).toBeInTheDocument();
    
    // Action buttons have appropriate text and icons
    const buttons = screen.getAllByTestId('button');
    buttons.forEach(button => {
      expect(button.querySelector('div[data-testid]')).toBeInTheDocument();
    });
  });
});