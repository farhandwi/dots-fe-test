import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Radix UI Dialog
jest.mock('@radix-ui/react-dialog', () => {
  const MockPortal = ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-portal">{children}</div>;
  
  const MockOverlay = React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => (
    <div ref={ref} data-testid="dialog-overlay" className={className} {...props} />
  ));
  MockOverlay.displayName = 'Overlay';
  
  const MockContent = React.forwardRef<HTMLDivElement, any>(({ className, children, ...props }, ref) => (
    <div ref={ref} data-testid="dialog-content" className={className} {...props}>
      {children}
    </div>
  ));
  MockContent.displayName = 'Content';
  
  const MockTitle = React.forwardRef<HTMLHeadingElement, any>(({ className, ...props }, ref) => (
    <h2 ref={ref} data-testid="dialog-title" className={className} {...props} />
  ));
  MockTitle.displayName = 'Title';
  
  const MockDescription = React.forwardRef<HTMLParagraphElement, any>(({ className, ...props }, ref) => (
    <p ref={ref} data-testid="dialog-description" className={className} {...props} />
  ));
  MockDescription.displayName = 'Description';
  
  const MockTrigger = React.forwardRef<HTMLButtonElement, any>(({ ...props }, ref) => (
    <button ref={ref} data-testid="dialog-trigger" {...props} />
  ));
  
  const MockClose = React.forwardRef<HTMLButtonElement, any>(({ ...props }, ref) => (
    <button ref={ref} data-testid="dialog-close" {...props} />
  ));
  
  // Mock root component that handles open state
  const MockRoot = ({ children, open, onOpenChange }: { children: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void }) => {
    return <div data-testid="dialog-root" data-state={open ? 'open' : 'closed'}>{children}</div>;
  };
  
  return {
    Root: MockRoot,
    Trigger: MockTrigger,
    Portal: MockPortal,
    Overlay: MockOverlay,
    Content: MockContent,
    Title: MockTitle,
    Description: MockDescription,
    Close: MockClose,
  };
});

// Mock lucide-react
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X Icon</div>,
}));

// Mock utility function
jest.mock('../../src/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Import components after mocks
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

describe('Dialog Components', () => {
  // Test Dialog (Root) Component
  describe('Dialog', () => {
    test('renders dialog root with children', () => {
      render(
        <Dialog open={true}>
          <div>Dialog Content</div>
        </Dialog>
      );
      
      const dialogRoot = screen.getByTestId('dialog-root');
      expect(dialogRoot).toBeInTheDocument();
      expect(dialogRoot).toHaveAttribute('data-state', 'open');
      expect(dialogRoot).toHaveTextContent('Dialog Content');
    });
    
    test('handles closed state', () => {
      render(
        <Dialog open={false}>
          <div>Dialog Content</div>
        </Dialog>
      );
      
      const dialogRoot = screen.getByTestId('dialog-root');
      expect(dialogRoot).toHaveAttribute('data-state', 'closed');
    });
  });

  // Test DialogTrigger Component
  describe('DialogTrigger', () => {
    test('renders trigger button', () => {
      render(<DialogTrigger>Open Dialog</DialogTrigger>);
      
      const triggerButton = screen.getByTestId('dialog-trigger');
      expect(triggerButton).toBeInTheDocument();
      expect(triggerButton).toHaveTextContent('Open Dialog');
    });
  });

  // Test DialogOverlay Component
  describe('DialogOverlay', () => {
    test('renders with default classes', () => {
      render(<DialogOverlay />);
      
      const overlay = screen.getByTestId('dialog-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay.className).toContain('fixed inset-0 z-50 bg-black/80');
      expect(overlay.className).toContain('data-[state=open]:animate-in');
      expect(overlay.className).toContain('data-[state=closed]:animate-out');
    });
    
    test('applies additional className', () => {
      render(<DialogOverlay className="custom-overlay" />);
      
      const overlay = screen.getByTestId('dialog-overlay');
      expect(overlay.className).toContain('custom-overlay');
    });
  });

  // Test DialogContent Component
  describe('DialogContent', () => {
    test('renders content with default structure', () => {
      render(
        <DialogContent>
          <p>Dialog Content</p>
        </DialogContent>
      );
      
      // Check portal and overlay are rendered
      const portal = screen.getByTestId('dialog-portal');
      expect(portal).toBeInTheDocument();
      
      const overlay = screen.getByTestId('dialog-overlay');
      expect(overlay).toBeInTheDocument();
      
      // Check content with children
      const content = screen.getByTestId('dialog-content');
      expect(content).toBeInTheDocument();
      expect(content.className).toContain('fixed left-[50%] top-[50%] z-50');
      expect(content).toHaveTextContent('Dialog Content');
      
      // Check close button
      const closeButton = screen.getByTestId('dialog-close');
      expect(closeButton).toBeInTheDocument();
      
      // Check X icon
      const xIcon = screen.getByTestId('x-icon');
      expect(xIcon).toBeInTheDocument();
      
      // Check sr-only text
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
    
    test('applies additional className to content', () => {
      render(
        <DialogContent className="custom-content">
          Content
        </DialogContent>
      );
      
      const content = screen.getByTestId('dialog-content');
      expect(content.className).toContain('custom-content');
    });
  });

  // Test DialogHeader Component
  describe('DialogHeader', () => {
    test('renders with default classes', () => {
      render(
        <DialogHeader data-testid="dialog-header">
          <span>Header Content</span>
        </DialogHeader>
      );
      
      const header = screen.getByTestId('dialog-header');
      expect(header).toBeInTheDocument();
      expect(header.className).toContain('flex');
      expect(header.className).toContain('flex-col');
      expect(header.className).toContain('space-y-1.5');
      expect(header.className).toContain('text-center');
      expect(header.className).toContain('sm:text-left');
    });
    
    test('applies additional className', () => {
      render(
        <DialogHeader data-testid="dialog-header" className="custom-header">
          Header Content
        </DialogHeader>
      );
      
      const header = screen.getByTestId('dialog-header');
      expect(header.className).toContain('custom-header');
    });
  });

  // Test DialogFooter Component
  describe('DialogFooter', () => {
    test('renders with default classes', () => {
      render(
        <DialogFooter data-testid="dialog-footer">
          <button>Cancel</button>
          <button>Submit</button>
        </DialogFooter>
      );
      
      const footer = screen.getByTestId('dialog-footer');
      expect(footer).toBeInTheDocument();
      expect(footer.className).toContain('flex');
      expect(footer.className).toContain('flex-col-reverse');
      expect(footer.className).toContain('sm:flex-row');
      expect(footer.className).toContain('sm:justify-end');
      expect(footer.className).toContain('sm:space-x-2');
    });
    
    test('applies additional className', () => {
      render(
        <DialogFooter data-testid="dialog-footer" className="custom-footer">
          <button>Action</button>
        </DialogFooter>
      );
      
      const footer = screen.getByTestId('dialog-footer');
      expect(footer.className).toContain('custom-footer');
    });
  });

  // Test DialogTitle Component
  describe('DialogTitle', () => {
    test('renders with default classes', () => {
      render(<DialogTitle>Dialog Title</DialogTitle>);
      
      const title = screen.getByTestId('dialog-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Dialog Title');
      expect(title).toHaveClass('text-lg font-semibold leading-none tracking-tight');
    });
    
    test('applies additional className', () => {
      render(<DialogTitle className="custom-title">Title</DialogTitle>);
      
      const title = screen.getByTestId('dialog-title');
      expect(title).toHaveClass('custom-title');
    });
  });

  // Test DialogDescription Component
  describe('DialogDescription', () => {
    test('renders with default classes', () => {
      render(<DialogDescription>This is a description</DialogDescription>);
      
      const description = screen.getByTestId('dialog-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('This is a description');
      expect(description).toHaveClass('text-sm text-muted-foreground');
    });
    
    test('applies additional className', () => {
      render(<DialogDescription className="custom-desc">Description</DialogDescription>);
      
      const description = screen.getByTestId('dialog-description');
      expect(description).toHaveClass('custom-desc');
    });
  });

  // Integration Test for Dialog Components
  test('renders full dialog composition', () => {
    render(
      <Dialog open={true}>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>This is a dialog description.</DialogDescription>
          </DialogHeader>
          <div>Main content area</div>
          <DialogFooter>
            <button>Cancel</button>
            <button>Submit</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    // Verify structure
    expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
    
    // Verify content
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('This is a dialog description.')).toBeInTheDocument();
    expect(screen.getByText('Main content area')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});