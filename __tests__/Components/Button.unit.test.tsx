import React from 'react';
import { render, screen, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  // Test rendering of the button with default props
  test('renders button with default props', () => {
    render(<Button>Click me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('bg-primary');
    expect(buttonElement).toHaveClass('text-primary-foreground');
    expect(buttonElement).toHaveClass('h-9');
    expect(buttonElement).toHaveClass('px-4');
    expect(buttonElement).toHaveClass('py-2');
  });

  // Test different variants
  test('renders with different variants', () => {
    const variants = [
      { variant: 'destructive' as const, expectedClasses: ['bg-destructive', 'text-destructive-foreground'] },
      { variant: 'outline' as const, expectedClasses: ['border', 'border-input', 'bg-background'] },
      { variant: 'secondary' as const, expectedClasses: ['bg-secondary', 'text-secondary-foreground'] },
      { variant: 'ghost' as const, expectedClasses: ['hover:bg-accent'] },
      { variant: 'link' as const, expectedClasses: ['text-primary', 'underline-offset-4'] }
    ];

    variants.forEach(({ variant, expectedClasses }) => {
      const { unmount } = render(<Button variant={variant}>Test Button</Button>);
      const buttonElement = screen.getByRole('button', { name: /test button/i });
      
      expectedClasses.forEach(cls => {
        expect(buttonElement).toHaveClass(cls);
      });

      // Use the destructured unmount method
      unmount();
    });
  });

  // Test different sizes
  test('renders with different sizes', () => {
    const sizes = [
      { size: 'sm' as const, expectedClasses: ['h-8', 'rounded-md', 'px-3', 'text-xs'] },
      { size: 'lg' as const, expectedClasses: ['h-10', 'rounded-md', 'px-8'] },
      { size: 'icon' as const, expectedClasses: ['h-9', 'w-9'] }
    ];

    sizes.forEach(({ size, expectedClasses }) => {
      const { unmount } = render(<Button size={size}>Test Button</Button>);
      const buttonElement = screen.getByRole('button', { name: /test button/i });
      
      expectedClasses.forEach(cls => {
        expect(buttonElement).toHaveClass(cls);
      });

      // Use the destructured unmount method
      unmount();
    });
  });

  // Test asChild prop
  test('renders as a different component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const linkElement = screen.getByRole('link', { name: /link button/i });
    expect(linkElement).toBeInTheDocument();
  });

  // Test disabled state
  test('applies disabled styles when disabled', () => {
    render(<Button disabled>Disabled Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /disabled button/i });
    
    expect(buttonElement).toBeDisabled();
    expect(buttonElement).toHaveClass('disabled:opacity-50');
    expect(buttonElement).toHaveClass('disabled:pointer-events-none');
  });

  // Test click event
  test('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    
    const buttonElement = screen.getByRole('button', { name: /clickable button/i });
    
    await userEvent.click(buttonElement);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test additional className
  test('applies additional className', () => {
    render(<Button className="test-class">Test Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /test button/i });
    
    expect(buttonElement).toHaveClass('test-class');
  });
});