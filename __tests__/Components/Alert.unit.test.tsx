import React from 'react';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert Component', () => {
  // Test default variant rendering
  test('renders with default variant', () => {
    render(
      <Alert>
        <AlertTitle>Test Title</AlertTitle>
        <AlertDescription>Test Description</AlertDescription>
      </Alert>
    );

    // Check alert element
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveClass('bg-background');
    expect(alertElement).toHaveClass('text-foreground');
    
    // Check title
    const titleElement = screen.getByText('Test Title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass('mb-1');
    expect(titleElement).toHaveClass('font-medium');
    expect(titleElement).toHaveClass('leading-none');
    expect(titleElement).toHaveClass('tracking-tight');

    // Check description
    const descElement = screen.getByText('Test Description');
    expect(descElement).toBeInTheDocument();
    expect(descElement).toHaveClass('text-sm');
  });

  // Test destructive variant
  test('renders with destructive variant', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error Title</AlertTitle>
        <AlertDescription>Error Description</AlertDescription>
      </Alert>
    );

    // Check alert element
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveClass('border-destructive/50');
    expect(alertElement).toHaveClass('text-destructive');
  });

  // Test additional className
  test('applies additional className', () => {
    render(
      <Alert className="custom-alert-class">
        <AlertTitle className="custom-title-class">Test Title</AlertTitle>
        <AlertDescription className="custom-desc-class">Test Description</AlertDescription>
      </Alert>
    );

    const alertElement = screen.getByRole('alert');
    const titleElement = screen.getByText('Test Title');
    const descElement = screen.getByText('Test Description');

    expect(alertElement).toHaveClass('custom-alert-class');
    expect(titleElement).toHaveClass('custom-title-class');
    expect(descElement).toHaveClass('custom-desc-class');
  });

  // Test Alert composition
  test('renders Alert with multiple children', () => {
    render(
      <Alert>
        <AlertTitle>Main Title</AlertTitle>
        <AlertDescription>First Description</AlertDescription>
        <AlertDescription>Second Description</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('First Description')).toBeInTheDocument();
    expect(screen.getByText('Second Description')).toBeInTheDocument();
  });

  // Test forwarded ref
  test('forwards ref to div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Alert ref={ref}>
        <AlertTitle>Ref Test</AlertTitle>
      </Alert>
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('DIV');
  });

  // Test AlertTitle and AlertDescription refs
  test('forwards refs for AlertTitle and AlertDescription', () => {
    const titleRef = React.createRef<HTMLHeadingElement>();
    const descRef = React.createRef<HTMLParagraphElement>();

    render(
      <Alert>
        <AlertTitle ref={titleRef}>Title with Ref</AlertTitle>
        <AlertDescription ref={descRef}>Description with Ref</AlertDescription>
      </Alert>
    );

    expect(titleRef.current).not.toBeNull();
    expect(titleRef.current?.tagName).toBe('H5');
    
    expect(descRef.current).not.toBeNull();
    expect(descRef.current?.tagName).toBe('DIV');
  });

  // Accessibility test
  test('maintains correct accessibility attributes', () => {
    render(
      <Alert>
        <AlertTitle>Accessibility Test</AlertTitle>
        <AlertDescription>Accessible Description</AlertDescription>
      </Alert>
    );

    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveAttribute('role', 'alert');
  });
});