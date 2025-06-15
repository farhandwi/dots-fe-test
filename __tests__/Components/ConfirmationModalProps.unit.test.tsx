import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmationModal from '@/components/modal/ConfirmationModalProps';

// Mock the Button component from @/components/ui/button
jest.mock('../../src/components/ui/button', () => {
  return {
    Button: ({ children, onClick, className, variant }: { 
      children: React.ReactNode, 
      onClick?: () => void, 
      className?: string,
      variant?: string 
    }) => (
      <button onClick={onClick} className={className} data-testid={`button-${variant || 'default'}`}>
        {children}
      </button>
    ),
  };
});

describe('ConfirmationModal', () => {
  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when open is false', () => {
    render(
      <ConfirmationModal
        open={false}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
  });

  it('should render with default props when open is true', () => {
    render(
      <ConfirmationModal
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(screen.getByText('You have unsaved changes. Are you sure you want to leave this page?')).toBeInTheDocument();
    expect(screen.getByText('Stay on Page')).toBeInTheDocument();
    expect(screen.getByText('Discard Changes')).toBeInTheDocument();
  });

  it('should render with custom title and message', () => {
    const customTitle = 'Custom Title';
    const customMessage = 'Custom message here';
    
    render(
      <ConfirmationModal
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        title={customTitle}
        message={customMessage}
      />
    );
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('should call onCancel when clicking on the overlay', () => {
    render(
      <ConfirmationModal
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );
    
    // Target the overlay div directly using its class
    const overlay = document.querySelector('.fixed.inset-0.bg-black.opacity-50');
    expect(overlay).not.toBeNull();
    if (overlay) fireEvent.click(overlay);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when clicking the X button', () => {
    render(
      <ConfirmationModal
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );
    
    const closeButton = screen.getByText('X');
    fireEvent.click(closeButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when clicking the "Stay on Page" button', () => {
    render(
      <ConfirmationModal
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );
    
    const stayButton = screen.getByText('Stay on Page');
    fireEvent.click(stayButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when clicking the "Discard Changes" button', () => {
    render(
      <ConfirmationModal
        open={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
      />
    );
    
    const discardButton = screen.getByText('Discard Changes');
    fireEvent.click(discardButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});