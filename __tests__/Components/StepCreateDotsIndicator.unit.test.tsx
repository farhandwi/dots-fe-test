import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StepCreateDotsIndicator from '../../src/components/StepCreateDotsIndicator';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Check: () => <div data-testid="check-icon" />
}));

describe('StepCreateDotsIndicator Component', () => {
  // Test configurations for different dot types
  const testConfigurations = [
    {
      dotsType: 'employee',
      totalSteps: 9,
      label: 'Employee Dots',
      stepLabels: [
        'Form Type', 'Category', 'Destination Information', 
        'Cost Center', 'Employee\nInformation', 'Payment\nInformation', 
        'Transaction\nDetail', 'Additional\nInformation', 'Review'
      ]
    },
    {
      dotsType: 'vendor',
      totalSteps: 8,
      label: 'Vendor Dots',
      stepLabels: [
        'Destination Information', 'Cost Center', 'Employee\nInformation', 
        'Vendor\nInformation', 'Payment\nInformation', 
        'Transaction\nDetail', 'Additional\nInformation', 'Review'
      ]
    }
  ];

  // Test each configuration
  testConfigurations.forEach(({ dotsType, totalSteps, label, stepLabels }) => {
    describe(`${label}`, () => {
      test('renders all steps correctly', () => {
        render(<StepCreateDotsIndicator currentStep={1} DotsType={dotsType} />);
        
        // Check total number of step indicators
        const stepIndicators = screen.getAllByText(/\d+/);
        expect(stepIndicators).toHaveLength(totalSteps);
      });

      test('correct grid layout', () => {
        const { container } = render(<StepCreateDotsIndicator currentStep={1} DotsType={dotsType} />);
        
        // Check grid layout classes
        const gridContainer = container.querySelector('div[class*="grid grid-cols-4"]');
        expect(gridContainer).toHaveClass(`grid grid-cols-4 md:grid-cols-4 ${
          dotsType === 'employee' ? 'lg:grid-cols-9' : 'lg:grid-cols-8'
        } gap-4 md:gap-4 mb-3`);
      });

      test('progress bar width updates correctly', () => {
        const { container } = render(<StepCreateDotsIndicator currentStep={3} DotsType={dotsType} />);
        
        // Check mobile progress bar width
        const progressBar = container.querySelector('div[class*="absolute top-0 left-0 h-full bg-blue-500"]');
        const expectedWidth = `${(3 - 1) * (100 / (totalSteps - 1))}%`;
        
        expect(progressBar).toHaveStyle(`width: ${expectedWidth}`);
      });

      test('step indicators show correct active states', () => {
        const { container } = render(<StepCreateDotsIndicator currentStep={3} DotsType={dotsType} />);
        
        // First two steps should be completed (have check icon)
        const checkIcons = screen.getAllByTestId('check-icon');
        expect(checkIcons).toHaveLength(2);
        
        // Third step should be active (blue background, scale)
        const activeStep = container.querySelector('div[class*="bg-blue-500 text-white scale-110"]');
        expect(activeStep).toBeInTheDocument();
      });

      test('renders correct step labels', () => {
        render(<StepCreateDotsIndicator currentStep={1} DotsType={dotsType} />);
        
        // Check each label individually
        stepLabels.forEach((label) => {
          // Split the label into words, handling newline characters
          const labelParts = label.split(/\n| /);
          
          // Check that at least one part of the label is found
          const foundParts = labelParts.filter(part => 
            screen.queryAllByText(new RegExp(part, 'i')).length > 0
          );
          
          expect(foundParts.length).toBeGreaterThan(0);
        });
      });
    });
  });

  test('handles null DotsType gracefully', () => {
    const { container } = render(<StepCreateDotsIndicator currentStep={1} DotsType={null} />);
    
    // Should render vendor steps by default
    const stepIndicators = screen.getAllByText(/\d+/);
    expect(stepIndicators).toHaveLength(8);
  });

  test('mobile progress bar exists', () => {
    const { container } = render(<StepCreateDotsIndicator currentStep={1} DotsType="vendor" />);
    
    // Check mobile progress bar
    const progressBarContainer = container.querySelector('div[class*="mt-3 relative h-1 bg-gray-200 rounded-full"]');
    expect(progressBarContainer).toBeInTheDocument();
  });
});