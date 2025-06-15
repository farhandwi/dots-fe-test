import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import Swal from 'sweetalert2';
import TransactionDetail from '@/app/detail/[dots_no_hash]/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}));
jest.mock('../../src/lib/auth-context');
jest.mock('axios');
jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
  showLoading: jest.fn()
}));
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(() => ({ exp: Math.floor(Date.now() / 1000) + 3600 }))
}));

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  writable: true,
  value: { reload: jest.fn() }
});

// Mock environment variables
process.env.NEXT_PUBLIC_DOTS_BE_END_POINT = 'http://localhost:5000/api';
process.env.NEXT_PUBLIC_BPMS_BE_END_POINT = 'http://localhost:3000/api';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Mock child components to reduce complexity
jest.mock('../../src/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));
jest.mock('../../src/components/detail/TransactionProgress', () => ({
  __esModule: true,
  default: () => <div>Transaction Progress</div>
}));
jest.mock('../../src/components/detail/MaterialDetilTable', () => ({
  __esModule: true,
  default: ({ setMaterialGroup, setMaterialData }: any) => {
    React.useEffect(() => {
      setMaterialGroup(['MG001', 'IN001']);
      setMaterialData([
        { material_item_desc_en: 'Material 1', realization_amt: 1000 },
        { material_item_desc_en: 'Material 2', realization_amt: 2000 }
      ]);
    }, []);
    return <div>Material Items Table</div>;
  }
}));
jest.mock('../../src/components/detail/GlDetilTable', () => ({
  __esModule: true,
  default: () => <div>GL Items Table</div>
}));
jest.mock('../../src/components/detail/MFiles', () => ({
  __esModule: true,
  default: ({ setIsUploadMfiles }: any) => {
    React.useEffect(() => {
      setIsUploadMfiles(true);
    }, []);
    return <div>MFiles Section</div>;
  }
}));
jest.mock('../../src/components/DeleteModal', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm }: any) => isOpen ? (
    <div>
      Delete Modal
      <button onClick={() => onConfirm('Test remark')}>Confirm Delete</button>
    </div>
  ) : null
}));

// Mock data
const mockTransaction = {
  BUKRS: 'TUGU',
  dots_number: 'DOTS123',
  dots_no_hash: 'hash123',
  form_type: 'Cash in Advance',
  trx_type: '1',
  status: '1010',
  status_desc: 'Draft',
  category: 'Employee',
  created_by: 'user@example.com',
  created_date: '2024-01-01',
  modified_by: 'user@example.com',
  modified_date: '2024-01-01',
  employee_name: 'John Doe',
  bpid: 'BP001',
  cost_center_bp: 'CC001',
  cost_center_verificator_1: 'CC001',
  cost_center_verificator_2: null,
  purpose: 'Business trip',
  curr_id: 'IDR',
  total_proposed_amt: 1000000,
  total_realization_amt: 900000,
  total_diff_amt: 100000,
  pol_number: 'POL123' // Note: Has policy number by default
};

const mockUser = {
  email: 'user@example.com',
  partner: 'P001',
  application: [{
    app_id: 'DOTS',
    app_name: 'DOTS',
    app_url: 'http://dots.com',
    is_active: 1,
    role: [
      { bp: 'BP001', cost_center: 'CC001', user_type: 'VD001' },
      { bp: 'BP001', cost_center: null, user_type: 'VA001' }
    ],
    cost_center_approval: {
      approval1: 'APP1',
      approval2: 'APP2',
      approval3: null,
      approval4: null,
      approval5: null
    }
  }]
};

const mockRouter = {
  push: jest.fn(),
};

const mockAxiosJWT = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
};

// Mock useAxiosJWT hook
jest.mock('../../src/hooks/useAxiosJwt', () => ({
  useAxiosJWT: () => mockAxiosJWT
}));

const defaultProps = {
  params: { dots_no_hash: 'hash123' }
};

describe('TransactionDetail', () => {
  let originalConsoleError: any;

  beforeAll(() => {
    // Suppress console errors for this test suite
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock axios for token refresh - wrap in setTimeout to avoid act warnings
    (axios.get as jest.Mock).mockImplementation(() => 
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: { data: { token: 'mock-token' } } });
        }, 0);
      })
    );
    
    // Setup default mock responses
    mockAxiosJWT.get.mockImplementation((url) => {
      if (url.includes('/get/transaction-non-insurance')) {
        return Promise.resolve({ status: 200, data: mockTransaction });
      }
      if (url.includes('/transaction-logs')) {
        return Promise.resolve({ status: 200, data: { data: [] } });
      }
      if (url.includes('/cost-center-approval')) {
        return Promise.resolve({
          status: 200,
          data: {
            cost_center_approval: {
              approval1: 'APP1',
              approval2: 'APP2',
              approval3: null,
              approval4: null,
              approval5: null
            }
          }
        });
      }
      if (url.includes('/bp/email')) {
        return Promise.resolve({
          status: 200,
          data: { data: [{ BP: 'BP001' }] }
        });
      }
      return Promise.resolve({
        status: 200,
        data: {
          data: {
            approval1: [],
            approval2: []
          }
        }
      });
    });
    
    mockAxiosJWT.post.mockResolvedValue({ status: 200, data: { 
      data: {
        approval1: [{ name: 'Approver 1', email: 'approver1@example.com', bp: 'BP001' }],
        approval2: [{ name: 'Approver 2', email: 'approver2@example.com', bp: 'BP002' }]
      }
    }});
    
    // Mock Swal
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
  });

  describe('Button Visibility Tests', () => {
    it('should show Update, Delete, and Request Approval buttons for creator with status 1010', async () => {
      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        // Wait for initial token refresh
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Should show these buttons for creator with status 1010
      expect(screen.getByText('Update')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Request Approval')).toBeInTheDocument();
      
      // Should not show approval buttons
      expect(screen.queryByText('Approve Transaction')).not.toBeInTheDocument();
    });

    it('should show only Back button for non-creator', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, email: 'other@example.com' }
      });

      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.queryByText('Update')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
      expect(screen.queryByText('Request Approval')).not.toBeInTheDocument();
    });

    it('should show Approve button for approver with eligible role', async () => {
      const approverTransaction = { ...mockTransaction, status: '1020', status_desc: 'Waiting Approval 1' };
      
      mockAxiosJWT.get.mockImplementation((url) => {
        if (url.includes('/get/transaction-non-insurance')) {
          return Promise.resolve({ status: 200, data: approverTransaction });
        }
        if (url.includes('/transaction-logs')) {
          return Promise.resolve({ status: 200, data: { data: [] } });
        }
        if (url.includes('/cost-center-approval')) {
          return Promise.resolve({
            status: 200,
            data: {
              cost_center_approval: {
                approval1: 'APP1',
                approval2: 'APP2'
              }
            }
          });
        }
        return Promise.resolve({ status: 200, data: { data: { approval1: [], approval2: [] } } });
      });

      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByText('Approve Transaction')).toBeInTheDocument();
      expect(screen.getByText('Revise')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    it('should show Proceed button for status 1060 Cash in Advance', async () => {
      const proceedTransaction = { 
        ...mockTransaction, 
        status: '1060',
        trx_type: '2',
        form_type: 'Cash in Advance'
      };
      
      mockAxiosJWT.get.mockImplementation((url) => {
        if (url.includes('/get/transaction-non-insurance')) {
          return Promise.resolve({ status: 200, data: proceedTransaction });
        }
        if (url.includes('/transaction-logs')) {
          return Promise.resolve({ status: 200, data: { data: [] } });
        }
        if (url.includes('/cost-center-approval')) {
          return Promise.resolve({
            status: 200,
            data: {
              cost_center_approval: {
                approval1: 'APP1',
                approval2: 'APP2'
              }
            }
          });
        }
        return Promise.resolve({ status: 200, data: { data: { approval1: [], approval2: [] } } });
      });

      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByText('Proceed to the next process')).toBeInTheDocument();
    });

    it('should show Create Material button for Disbursement status 2010', async () => {
      const disbursementTransaction = { 
        ...mockTransaction, 
        status: '2010',
        trx_type: '2',
        form_type: 'Disbursement'
      };
      
      mockAxiosJWT.get.mockImplementation((url) => {
        if (url.includes('/get/transaction-non-insurance')) {
          return Promise.resolve({ status: 200, data: disbursementTransaction });
        }
        if (url.includes('/transaction-logs')) {
          return Promise.resolve({ status: 200, data: { data: [] } });
        }
        if (url.includes('/cost-center-approval')) {
          return Promise.resolve({
            status: 200,
            data: {
              cost_center_approval: {
                approval1: 'APP1',
                approval2: 'APP2'
              }
            }
          });
        }
        return Promise.resolve({ status: 200, data: { data: { approval1: [], approval2: [] } } });
      });

      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByText('Create Material')).toBeInTheDocument();
    });
  });

  describe('User Actions', () => {
    it('should handle delete action', async () => {
      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Modal')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Confirm Delete');
      
      mockAxiosJWT.delete.mockResolvedValueOnce({ status: 200 });
      
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      expect(mockAxiosJWT.delete).toHaveBeenCalledWith(
        expect.stringContaining('/transaction-non-insurance'),
        expect.objectContaining({
          data: expect.objectContaining({
            dots_number: 'DOTS123',
            email: 'user@example.com',
            remark: 'Test remark'
          })
        })
      );
    });

    it('should handle update navigation', async () => {
      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      const updateButton = screen.getByText('Update');
      fireEvent.click(updateButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/detail/update/hash123');
    });

    it('should handle request approval with policy validation', async () => {
      // Mock transaction without policy number but with insurance material group
      const noPolicyTransaction = { ...mockTransaction, pol_number: '' };
      
      mockAxiosJWT.get.mockImplementation((url) => {
        if (url.includes('/get/transaction-non-insurance')) {
          return Promise.resolve({ status: 200, data: noPolicyTransaction });
        }
        if (url.includes('/transaction-logs')) {
          return Promise.resolve({ status: 200, data: { data: [] } });
        }
        if (url.includes('/cost-center-approval')) {
          return Promise.resolve({
            status: 200,
            data: {
              cost_center_approval: {
                approval1: 'APP1',
                approval2: 'APP2'
              }
            }
          });
        }
        return Promise.resolve({ status: 200, data: { data: { approval1: [], approval2: [] } } });
      });

      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      const requestButton = screen.getByText('Request Approval');
      
      await act(async () => {
        fireEvent.click(requestButton);
      });

      // Since material group includes 'IN001' and pol_number is empty,
      // should show warning for missing policy number
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Warning!',
          icon: 'warning',
          text: expect.stringContaining('Policy Number is mandatory')
        })
      );
    });

    it('should handle successful request approval', async () => {
      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      const requestButton = screen.getByText('Request Approval');
      
      mockAxiosJWT.post.mockResolvedValueOnce({ status: 200 });
      
      await act(async () => {
        fireEvent.click(requestButton);
      });

      // Should show submit confirmation
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Submit Transaction',
          icon: 'question',
          confirmButtonText: 'Yes, submit it!'
        })
      );
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      render(<TransactionDetail {...defaultProps} />);
      expect(screen.getByText('Loading transaction...')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      // Temporarily mock console.error for this specific test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockAxiosJWT.get.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Conditional Rendering', () => {
    it('should show Vendor Information for vendor category', async () => {
      const vendorTransaction = { 
        ...mockTransaction, 
        category: 'Vendor',
        client_bpid: 'CLIENT001',
        client_name: 'Test Client',
        address: 'Test Address'
      };

      mockAxiosJWT.get.mockImplementation((url) => {
        if (url.includes('/get/transaction-non-insurance')) {
          return Promise.resolve({ status: 200, data: vendorTransaction });
        }
        if (url.includes('/transaction-logs')) {
          return Promise.resolve({ status: 200, data: { data: [] } });
        }
        if (url.includes('/cost-center-approval')) {
          return Promise.resolve({
            status: 200,
            data: {
              cost_center_approval: {
                approval1: 'APP1',
                approval2: 'APP2'
              }
            }
          });
        }
        return Promise.resolve({ status: 200, data: { data: { approval1: [], approval2: [] } } });
      });

      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(screen.getByText('Vendor Information')).toBeInTheDocument();
      });

      expect(screen.getByText('CLIENT001')).toBeInTheDocument();
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    it('should show SAP Information for completed status', async () => {
      const completedTransaction = { 
        ...mockTransaction, 
        status: '1050',
        sap_dp_request_no: 'SAP123'
      };

      mockAxiosJWT.get.mockImplementation((url) => {
        if (url.includes('/get/transaction-non-insurance')) {
          return Promise.resolve({ status: 200, data: completedTransaction });
        }
        if (url.includes('/transaction-logs')) {
          return Promise.resolve({ status: 200, data: { data: [] } });
        }
        if (url.includes('/cost-center-approval')) {
          return Promise.resolve({
            status: 200,
            data: {
              cost_center_approval: {
                approval1: 'APP1',
                approval2: 'APP2'
              }
            }
          });
        }
        return Promise.resolve({ status: 200, data: { data: { approval1: [], approval2: [] } } });
      });

      await act(async () => {
        render(<TransactionDetail {...defaultProps} />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading transaction...')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(screen.getByText('SAP Information')).toBeInTheDocument();
      });

      expect(screen.getByText('SAP123')).toBeInTheDocument();
    });
  });
});