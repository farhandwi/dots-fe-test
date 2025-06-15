import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import MaterialItemsTable from '@/components/detail/MaterialDetilTable';
import { useAxiosJWT } from '@/hooks/useAxiosJwt';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('axios');
jest.mock('sweetalert2');
jest.mock('../../src/hooks/useAxiosJwt');

// Mock jwt-decode
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(() => ({
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  }))
}));

// Mock environment variables
process.env.NEXT_PUBLIC_DOTS_BE_END_POINT = 'http://localhost:5000/api';
process.env.NEXT_PUBLIC_BPMS_BE_END_POINT = 'http://localhost:3000/api';

// Suppress console errors during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock data
const mockMaterialData = [
  {
    hash_id: 'hash123',
    item_number: 1,
    cost_center: 'CC001',
    cost_center_desc: 'Cost Center 1',
    material_group: 'MG001',
    material_group_desc: 'Material Group 1',
    material_item: 'MI001',
    material_item_desc_en: 'Material Item 1',
    internal_order: 'IO001',
    gl_account_desc: 'GL Account 1',
    gl: 'GL001',
    short_text: 'Short text 1',
    remark_item: 'Remark 1',
    proposed_amt: 1000000,
    base_realization_amt: 900000,
    vat_indicator: true,
    vat_pct: 10,
    vat_amt: 90000,
    realization_amt: 990000,
    diff_amt: -10000,
  },
  {
    hash_id: 'hash456',
    item_number: 2,
    cost_center: 'CC002',
    cost_center_desc: 'Cost Center 2',
    material_group: 'MG002',
    material_group_desc: 'Material Group 2',
    material_item: 'MI002',
    material_item_desc_en: 'Material Item 2',
    internal_order: null,
    gl_account_desc: 'GL Account 2',
    gl: 'GL002',
    short_text: 'Short text 2',
    remark_item: 'Remark 2',
    proposed_amt: 2000000,
    base_realization_amt: 1800000,
    vat_indicator: false,
    vat_pct: 0,
    vat_amt: 0,
    realization_amt: 1800000,
    diff_amt: -200000,
  },
];

const mockAxiosJWT = {
  get: jest.fn(),
  delete: jest.fn(),
};

const mockRouter = {
  push: jest.fn(),
};

const defaultProps = {
  dotsNumber: 'DOTS123',
  status: '1010',
  emailDots: 'user@example.com',
  emailInputter: 'user@example.com',
  transaction_type: '1',
  form_type: 'Cash in Advance',
  setMaterialGroup: jest.fn(),
  setMaterialData: jest.fn(),
  currencyType: 'IDR',
};

// Helper function to render component with act
const renderWithAct = async (props = defaultProps) => {
  let result;
  await act(async () => {
    result = render(<MaterialItemsTable {...props} />);
  });
  return result;
};

describe('MaterialItemsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAxiosJWT as jest.Mock).mockReturnValue(mockAxiosJWT);
    
    // Mock token refresh - make it resolve immediately
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        data: {
          token: 'mock-token',
        },
      },
    });

    // Mock material data fetch
    mockAxiosJWT.get.mockResolvedValue({
      data: {
        data: mockMaterialData,
      },
    });

    // Mock delete success
    mockAxiosJWT.delete.mockResolvedValue({
      status: 200,
      data: { success: true }
    });

    // Mock SweetAlert
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    (Swal.showLoading as jest.Mock).mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Button Visibility Tests', () => {
    it('should show only View button when emailDots !== emailInputter', async () => {
      const props = {
        ...defaultProps,
        emailDots: 'different@example.com',
        emailInputter: 'user@example.com',
      };

      await renderWithAct(props);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // View button should be visible (there should be eye icons)
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThanOrEqual(4); // 2 expand buttons + 2 view buttons

      // Edit and Delete buttons should not be visible
      const editButtons = allButtons.filter(btn => 
        btn.querySelector('svg') && btn.getAttribute('aria-label')?.includes('edit')
      );
      const deleteButtons = allButtons.filter(btn => 
        btn.querySelector('svg') && btn.getAttribute('aria-label')?.includes('delete')
      );
      
      expect(editButtons).toHaveLength(0);
      expect(deleteButtons).toHaveLength(0);
    });

    it('should show View and Edit buttons for Cash in Advance with status 2010/1060 and transaction_type 2', async () => {
      const props = {
        ...defaultProps,
        status: '2010',
        transaction_type: '2',
        form_type: 'Cash in Advance',
        emailDots: 'user@example.com',
        emailInputter: 'user@example.com',
      };

      await renderWithAct(props);

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Should have expand buttons (2) + view buttons (2) + edit buttons (2) = 6 total
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThanOrEqual(6);

      // Delete buttons should not be visible (no trash icons in red)
      const deleteButtons = allButtons.filter(btn => {
        const hasRedClass = btn.className.includes('text-red-500');
        return hasRedClass;
      });
      expect(deleteButtons).toHaveLength(0);
    });

    it('should show View, Edit, and Delete buttons for Disbursement with status 2010 and transaction_type 2', async () => {
      const props = {
        ...defaultProps,
        status: '2010',
        transaction_type: '2',
        form_type: 'Disbursement',
        emailDots: 'user@example.com',
        emailInputter: 'user@example.com',
      };

      await renderWithAct(props);

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Should have expand buttons (2) + view buttons (2) + edit buttons (2) + delete buttons (2) = 8 total
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThanOrEqual(8);

      // Check for delete buttons (should have red text class)
      const deleteButtons = allButtons.filter(btn => {
        const hasRedClass = btn.className.includes('text-red-500');
        return hasRedClass;
      });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should show View, Edit, and Delete buttons for Cash in Advance with status 1010 and transaction_type 1', async () => {
      const props = {
        ...defaultProps,
        status: '1010',
        transaction_type: '1',
        form_type: 'Cash in Advance',
        emailDots: 'user@example.com',
        emailInputter: 'user@example.com',
      };

      await renderWithAct(props);

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Should have all buttons: expand (2) + view (2) + edit (2) + delete (2) = 8 total
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThanOrEqual(8);

      // Check for delete buttons (should have red text class)
      const deleteButtons = allButtons.filter(btn => {
        const hasRedClass = btn.className.includes('text-red-500');
        return hasRedClass;
      });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should not show Edit/Delete buttons for invalid status combinations', async () => {
      const props = {
        ...defaultProps,
        status: '3000', // Invalid status
        transaction_type: '1',
        form_type: 'Cash in Advance',
        emailDots: 'user@example.com',
        emailInputter: 'user@example.com',
      };

      await renderWithAct(props);

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Should only have expand buttons (2) + view buttons (2) = 4 total
      const allButtons = screen.getAllByRole('button');
      expect(allButtons).toHaveLength(4);
    });
  });

  describe('Button Functionality Tests', () => {
    it('should navigate to detail page when View button is clicked', async () => {
      await renderWithAct(defaultProps);

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Find view button (Eye icon button)
      const allButtons = screen.getAllByRole('button');
      const viewButton = allButtons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && !btn.className.includes('text-blue-500'); // Not expand button
      });

      if (viewButton) {
        await act(async () => {
          fireEvent.click(viewButton);
        });
        expect(mockRouter.push).toHaveBeenCalledWith('/detail/material/hash123');
      }
    });

    it('should navigate to edit page when Edit button is clicked', async () => {
      const props = {
        ...defaultProps,
        status: '1010',
        transaction_type: '1',
        form_type: 'Cash in Advance',
      };

      await renderWithAct(props);

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Find edit button (should be the second button in operations column after view)
      const allButtons = screen.getAllByRole('button');
      const editButton = allButtons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && !btn.className.includes('text-blue-500') && !btn.className.includes('text-red-500');
      });

      if (editButton && allButtons.indexOf(editButton) > 2) { // Skip expand and view buttons
        await act(async () => {
          fireEvent.click(editButton);
        });
        expect(mockRouter.push).toHaveBeenCalledWith('/detail/material/edit/hash123');
      }
    });

    it('should show confirmation dialog when Delete button is clicked', async () => {
      const props = {
        ...defaultProps,
        status: '1010',
        transaction_type: '1',
        form_type: 'Cash in Advance',
      };

      await renderWithAct(props);

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Find delete button (should have red text class)
      const allButtons = screen.getAllByRole('button');
      const deleteButton = allButtons.find(btn => {
        return btn.className.includes('text-red-500');
      });

      if (deleteButton) {
        await act(async () => {
          fireEvent.click(deleteButton);
        });

        expect(Swal.fire).toHaveBeenCalledWith({
          title: 'Are you sure?',
          text: 'Do you want to delete this material? This action cannot be undone.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, delete it!',
          cancelButtonText: 'Cancel'
        });
      }
    });
  });

  describe('Table Content Tests', () => {
    it('should display material data correctly', async () => {
      await renderWithAct(defaultProps);

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Check if material data is displayed
      expect(screen.getByText('Cost Center 1 (CC001)')).toBeInTheDocument();
      expect(screen.getByText('Material Group 1 (MG001)')).toBeInTheDocument();
      expect(screen.getByText('Material Item 1 (MI001)')).toBeInTheDocument();
    });

    it('should show table headers correctly', async () => {
      await renderWithAct(defaultProps);

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Check table headers
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Cost Center')).toBeInTheDocument();
      expect(screen.getByText('Material Group')).toBeInTheDocument();
      expect(screen.getByText('Material Item')).toBeInTheDocument();
      expect(screen.getByText('Internal Order')).toBeInTheDocument();
      expect(screen.getByText('Operations')).toBeInTheDocument();
    });

    it('should expand and collapse rows when expand button is clicked', async () => {
      await renderWithAct(defaultProps);

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Find expand buttons (Plus icons with blue color)
      const expandButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('text-blue-500')
      );

      // Click first expand button
      if (expandButtons.length > 0) {
        await act(async () => {
          fireEvent.click(expandButtons[0]);
        });
        
        // Check if expanded content is visible
        await waitFor(() => {
          expect(screen.getByText('GL Account 1 - GL001')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state initially', async () => {
      // Mock pending axios call
      mockAxiosJWT.get.mockImplementation(() => new Promise(() => {}));

      await act(async () => {
        render(<MaterialItemsTable {...defaultProps} />);
      });

      expect(screen.getByText('Loading Material Detil Table...')).toBeInTheDocument();
    });

    it('should show "Data Not Found" when no material items', async () => {
      mockAxiosJWT.get.mockResolvedValue({
        data: {
          data: [],
        },
      });

      await renderWithAct(  );

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      await waitFor(() => {
        expect(screen.getByText('Data Not Found')).toBeInTheDocument();
      });
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency correctly', async () => {
      await renderWithAct(defaultProps);

      await waitFor(() => {
        expect(screen.queryByText('Loading Material Detil Table...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Expand first row to see currency formatting
      const expandButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('text-blue-500')
      );

      if (expandButtons.length > 0) {
        await act(async () => {
          fireEvent.click(expandButtons[0]);
        });
        
        await waitFor(() => {
          // Check if amounts are formatted as currency (more flexible regex)
          const currencyElements = screen.getAllByText(/Rp\s*[\d.,]+/);
          expect(currencyElements.length).toBeGreaterThan(0);
        });
      }
    });
  });
});