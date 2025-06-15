import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TotalDataDisplay from '@/components/TotalDataDisplay';

// Mock Lucide React icon
jest.mock('lucide-react', () => ({
  Database: () => <div data-testid="database-icon" />
}));

describe('TotalDataDisplay Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('handles small numbers correctly', () => {
    render(<TotalDataDisplay total={5} />);
    
    // Verify small number is displayed correctly
    const formattedTotal = screen.getByText('5', { selector: 'span.text-blue-600' });
    expect(formattedTotal).toBeInTheDocument();
  });

  test('returns null when total is null', () => {
    const { container } = render(<TotalDataDisplay total={null} />);
    
    // Verify nothing is rendered
    expect(container.firstChild).toBeNull();
  });

  test('returns null when total is 0', () => {
    const { container } = render(<TotalDataDisplay total={0} />);
    
    // Verify nothing is rendered
    expect(container.firstChild).toBeNull();
  });

  test('has the correct styling classes', () => {
    render(<TotalDataDisplay total={100} />);
    
    // Verify container has correct classes
    const container = screen.getByText(/Total Records:/i).closest('div');
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('items-center');
    expect(container).toHaveClass('gap-2');
    expect(container).toHaveClass('mb-4');
    expect(container).toHaveClass('bg-blue-50');
    expect(container).toHaveClass('p-2');
    expect(container).toHaveClass('rounded-md');
    expect(container).toHaveClass('w-fit');
  });

  test('has blue highlighted text for the total value', () => {
    render(<TotalDataDisplay total={100} />);
    
    // Verify total value has blue text class
    const formattedTotal = screen.getByText('100', { selector: 'span.text-blue-600' });
    expect(formattedTotal).toHaveClass('text-blue-600');
  });
});
