import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox Component', () => {
  // Test default rendering
  test('renders with default classes', () => {
    render(<Checkbox />);
    
    const checkboxElement = screen.getByRole('checkbox');
    expect(checkboxElement).toBeInTheDocument();
    
    // Check default classes
    expect(checkboxElement).toHaveClass('peer');
    expect(checkboxElement).toHaveClass('h-4');
    expect(checkboxElement).toHaveClass('w-4');
    expect(checkboxElement).toHaveClass('shrink-0');
    expect(checkboxElement).toHaveClass('rounded-sm');
    expect(checkboxElement).toHaveClass('border');
    expect(checkboxElement).toHaveClass('border-primary');
    expect(checkboxElement).toHaveClass('shadow');
  });

  // Test additional className
  test('applies additional className', () => {
    render(<Checkbox className="custom-checkbox-class" />);
    
    const checkboxElement = screen.getByRole('checkbox');
    expect(checkboxElement).toHaveClass('custom-checkbox-class');
  });

  // Test disabled state
  test('applies disabled styles', () => {
    render(<Checkbox disabled />);
    
    const checkboxElement = screen.getByRole('checkbox');
    expect(checkboxElement).toBeDisabled();
    expect(checkboxElement).toHaveClass('disabled:cursor-not-allowed');
    expect(checkboxElement).toHaveClass('disabled:opacity-50');
  });

  // Test checked state
  test('applies checked state styles', () => {
    render(<Checkbox defaultChecked />);
    
    const checkboxElement = screen.getByRole('checkbox');
    expect(checkboxElement).toBeChecked();
    expect(checkboxElement).toHaveClass('data-[state=checked]:bg-primary');
    expect(checkboxElement).toHaveClass('data-[state=checked]:text-primary-foreground');
  });

  // Test interaction
  test('toggles checked state when clicked', async () => {
    const user = userEvent.setup();
    render(<Checkbox />);
    
    const checkboxElement = screen.getByRole('checkbox');
    
    // Initial state should be unchecked
    expect(checkboxElement).not.toBeChecked();
    
    // Click to check
    await user.click(checkboxElement);
    expect(checkboxElement).toBeChecked();
    
    // Click to uncheck
    await user.click(checkboxElement);
    expect(checkboxElement).not.toBeChecked();
  });

  // Test ref forwarding
  test('forwards ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} />);
    
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  // Revised indicator rendering test
  test('renders check indicator when checked', async () => {
    const user = userEvent.setup();
    render(<Checkbox />);
    
    const checkboxElement = screen.getByRole('checkbox');
    
    // Click to check
    await user.click(checkboxElement);
    
    // Find the Check component within the checkbox
    const checkIcon = screen.getByRole('checkbox', { checked: true }).querySelector('svg');
    expect(checkIcon).toBeInTheDocument();
    expect(checkIcon).toHaveClass('h-4');
    expect(checkIcon).toHaveClass('w-4');
  });

  // Test focus and keyboard interaction
  test('supports keyboard interaction', async () => {
    const user = userEvent.setup();
    render(<Checkbox />);
    
    const checkboxElement = screen.getByRole('checkbox');
    
    // Focus the checkbox
    await user.tab();
    expect(checkboxElement).toHaveFocus();
    
    // Toggle with space key
    await user.keyboard('[Space]');
    expect(checkboxElement).toBeChecked();
    
    // Toggle again
    await user.keyboard('[Space]');
    expect(checkboxElement).not.toBeChecked();
  });

  // Accessibility attributes
  test('has correct accessibility attributes', () => {
    render(<Checkbox aria-label="Test Checkbox" />);
    
    const checkboxElement = screen.getByRole('checkbox');
    expect(checkboxElement).toHaveAttribute('aria-label', 'Test Checkbox');
  });
});