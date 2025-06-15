import React from 'react';
import { render, screen, RenderResult } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  // Test default variant rendering
  test('renders with default variant', () => {
    render(<Badge>Default Badge</Badge>);

    const badgeElement = screen.getByText('Default Badge');
    expect(badgeElement).toBeInTheDocument();
    
    // Check default variant classes
    expect(badgeElement).toHaveClass('border-transparent');
    expect(badgeElement).toHaveClass('bg-primary');
    expect(badgeElement).toHaveClass('text-primary-foreground');
    expect(badgeElement).toHaveClass('shadow');
    expect(badgeElement).toHaveClass('hover:bg-primary/80');
    
    // Check base badge classes
    expect(badgeElement).toHaveClass('inline-flex');
    expect(badgeElement).toHaveClass('items-center');
    expect(badgeElement).toHaveClass('rounded-md');
    expect(badgeElement).toHaveClass('border');
    expect(badgeElement).toHaveClass('px-2.5');
    expect(badgeElement).toHaveClass('py-0.5');
    expect(badgeElement).toHaveClass('text-xs');
    expect(badgeElement).toHaveClass('font-semibold');
  });

  // Test different variants
  test('renders with different variants', () => {
    const variants = [
      { 
        variant: 'secondary' as const, 
        expectedClasses: [
          'border-transparent', 
          'bg-secondary', 
          'text-secondary-foreground', 
          'hover:bg-secondary/80'
        ]
      },
      { 
        variant: 'destructive' as const, 
        expectedClasses: [
          'border-transparent', 
          'bg-destructive', 
          'text-destructive-foreground', 
          'shadow',
          'hover:bg-destructive/80'
        ]
      },
      { 
        variant: 'outline' as const, 
        expectedClasses: [
          'text-foreground'
        ]
      }
    ];

    variants.forEach(({ variant, expectedClasses }) => {
      const { unmount } = render(<Badge variant={variant}>Test Badge</Badge>);
      
      const badgeElement = screen.getByText('Test Badge');
      
      // Check variant-specific classes
      expectedClasses.forEach(cls => {
        expect(badgeElement).toHaveClass(cls);
      });

      // Use the destructured unmount method
      unmount();
    });
  });

  // Test additional className
  test('applies additional className', () => {
    render(<Badge className="custom-badge-class">Custom Badge</Badge>);
    
    const badgeElement = screen.getByText('Custom Badge');
    expect(badgeElement).toHaveClass('custom-badge-class');
  });

  // Test Badge with children
  test('renders with different children', () => {
    const { rerender } = render(<Badge>Text Badge</Badge>);
    expect(screen.getByText('Text Badge')).toBeInTheDocument();

    rerender(<Badge><span>Span Badge</span></Badge>);
    expect(screen.getByText('Span Badge')).toBeInTheDocument();
  });

  // Test additional props
  test('passes through additional props', () => {
    render(
      <Badge 
        data-testid="test-badge" 
        role="status" 
        aria-label="Test Badge Label"
      >
        Props Badge
      </Badge>
    );
    
    const badgeElement = screen.getByTestId('test-badge');
    expect(badgeElement).toHaveAttribute('role', 'status');
    expect(badgeElement).toHaveAttribute('aria-label', 'Test Badge Label');
  });

  // Snapshot test (optional, but can be useful)
  test('matches snapshot', () => {
    const { asFragment } = render(<Badge>Snapshot Badge</Badge>);
    expect(asFragment()).toMatchSnapshot();
  });
});