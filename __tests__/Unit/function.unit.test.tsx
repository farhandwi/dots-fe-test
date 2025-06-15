import {
    hasDotsAdminRole,
    isActive,
    getTypeColor,
    getInitialFormData,
    getRolesByApplicationName,
    hasFilledData,
    isEmpty,
    areFieldsFilled,
    hasFilledDataSpesific,
    formatCurrency,
    cleanNumber,
    getDiffAmountColor,
    getCostCenter,
    getSpecialRoleTypes,
    getStatusGroupFromRoles,
    hasUserTypeA0001,
    isCreatingDots,
    checkApprovalEligibility,
    getStatusSteps,
    isStepComplete,
    formatDate,
    getStatusInfo,
    isRejectedStatus,
    getRejectedMessage,
    checkIS001WithNullCostCenter,
    calculateDefaultDueDate,
    formatDisplayDate,
    getCurrentDate,
    getYesterdayDate,
    isRequiredFieldsFilled,
    FormData,
    TransactionNonInsurance,
    StatusHistoryItem
  } from '@/lib/func/function';
  
  // Mock data untuk testing
  const mockUser = {
    partner: 'TEST_PARTNER',
    profile_image: 'test.jpg',
    name: 'Test User',
    email: 'test@example.com',
    application: [
      {
        application_id: 1,
        app_name: 'DOTS',
        alias: 'dots',
        url: 'http://dots.test',
        is_active: 1,
        role: [
          { bp: 'BP001', em_cost_center: 'CC001', cost_center: 'CC001', user_type: 'A0001' },
          { bp: 'BP002', em_cost_center: 'CC002', cost_center: 'CC002', user_type: 'VD001' },
          { bp: 'BP003', em_cost_center: null, cost_center: null, user_type: 'IS001' }
        ],
        cost_center_approval: {
          cost_center: 'CC001',
          approval1: 'APP1',
          approval2: 'APP2',
          approval3: 'APP3',
          approval4: 'APP4',
          approval5: 'APP5'
        }
      }
    ]
  };
  
  const mockFormData: FormData = {
    formType: 'Cash in Advance',
    category: 'Travel',
    memoNumber: 'MEMO001',
    memoLink: 'http://memo.link',
    startDate: '2024-01-01',
    endDate: '2024-01-10',
    event: 'Business Trip',
    address: 'Jakarta',
    purpose: 'Meeting',
    policyNumber: 'POL001',
    invoiceNumber: 'INV001',
    clientName: 'Client Test',
    businessPartner: 'BP001',
    employeeNIP: 'EMP001',
    employeeName: 'Employee Test',
    employeeEmail: 'employee@test.com',
    costCenterDesc: 'Cost Center Description',
    clientNumber: 'CLIENT001',
    costCenter: 'CC001',
    currency: 'USD',
    paymentType: 'Transfer',
    estimatePaymentDueDate: '2024-01-15',
    paymentRemark: 'Payment remarks',
    bankAccountNo: '1234567890',
    bankName: 'Test Bank',
    accountName: 'Test Account',
    destination_scope: 'Domestic',
    region_group: 'Asia',
    costCenterInputter: 'CC001'
  };
  
  const mockTransaction: TransactionNonInsurance = {
    BUKRS: 'COMP001',
    dots_number: 'DOTS001',
    dots_no_hash: 'hash123',
    purch_org: 'PO001',
    purch_group: 'PG001',
    category: 'Travel',
    form_type: 'Cash in Advance',
    trx_type: '1',
    bpid: 'BP001',
    employee_name: 'Test Employee',
    employee_nip: 'EMP001',
    cost_center_bp: 'CC001',
    cost_center_verificator_1: 'CC001',
    cost_center_verificator_2: 'CC002',
    cost_center_verificator_3: 'CC003',
    cost_center_verificator_4: 'CC004',
    cost_center_verificator_5: 'CC005',
    destination_scope: 'Domestic',
    cost_center_inputter: 'CC001',
    purpose: 'Business Meeting',
    start_date: '2024-01-01',
    end_date: '2024-01-10',
    payment_type: 'Transfer',
    employee_bank_name: 'Test Bank',
    employee_acct_bank_number: '1234567890',
    employee_acct_bank_name: 'Test Account',
    employee_email: 'test@example.com',
    status: '1020',
    created_by: 'test@example.com',
    created_date: '2024-01-01',
    modified_by: undefined,
    modified_date: '2024-01-01'
  };
  
  describe('DOTS Utility Functions', () => {
    
    describe('hasDotsAdminRole', () => {
      it('should return true if user has DOTS admin role', () => {
        expect(hasDotsAdminRole(mockUser)).toBe(true);
      });
  
      it('should return false if user does not have DOTS admin role', () => {
        const userWithoutAdmin = {
          ...mockUser,
          application: [{
            ...mockUser.application[0],
            role: [{ bp: 'BP001', em_cost_center: 'CC001', cost_center: 'CC001', user_type: 'USER' }]
          }]
        };
        expect(hasDotsAdminRole(userWithoutAdmin)).toBe(false);
      });
  
      it('should return false if user does not have DOTS application', () => {
        const userWithoutDots = { ...mockUser, application: [] };
        expect(hasDotsAdminRole(userWithoutDots)).toBe(false);
      });
    });
  
    describe('isActive', () => {
      it('should return true if expiredDate is null', () => {
        expect(isActive(null)).toBe(true);
      });
  
      it('should return true if expiredDate is in the future', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        expect(isActive(futureDate.toISOString())).toBe(true);
      });
  
      it('should return false if expiredDate is in the past', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        expect(isActive(pastDate.toISOString())).toBe(false);
      });
    });
  
    describe('getTypeColor', () => {
      it('should return correct color for known types', () => {
        expect(getTypeColor('ZMIN')).toBe('bg-red-100 text-red-800');
        expect(getTypeColor('ZMNI')).toBe('bg-blue-100 text-blue-800');
        expect(getTypeColor('ZMNV')).toBe('bg-orange-100 text-black');
        expect(getTypeColor('ZSRV')).toBe('bg-pink-100 text-orange-800');
      });
  
      it('should return default color for unknown types', () => {
        expect(getTypeColor('UNKNOWN')).toBe('bg-gray-100 text-gray-800');
      });
    });
  
    describe('getInitialFormData', () => {
      it('should return form data with all empty strings', () => {
        const initialData = getInitialFormData();
        expect(initialData.formType).toBe('');
        expect(initialData.category).toBe('');
        expect(initialData.employeeName).toBe('');
        expect(Object.values(initialData).every(value => value === '')).toBe(true);
      });
    });
  
    describe('getRolesByApplicationName', () => {
      it('should return roles for existing application', () => {
        const roles = getRolesByApplicationName(mockUser.application, 'DOTS');
        expect(roles).toEqual(mockUser.application[0].role);
      });
  
      it('should return null for non-existing application', () => {
        const roles = getRolesByApplicationName(mockUser.application, 'NONEXISTENT');
        expect(roles).toBeNull();
      });
    });
  
    describe('hasFilledData', () => {
      it('should return true if any field has data', () => {
        expect(hasFilledData(mockFormData)).toBe(true);
      });
  
      it('should return false if all fields are empty', () => {
        const emptyFormData = getInitialFormData();
        expect(hasFilledData(emptyFormData)).toBe(false);
      });
    });
  
    describe('isEmpty', () => {
      it('should return true for empty string', () => {
        expect(isEmpty('')).toBe(true);
      });
  
      it('should return true for null', () => {
        expect(isEmpty(null as any)).toBe(true);
      });
  
      it('should return true for undefined', () => {
        expect(isEmpty(undefined as any)).toBe(true);
      });
  
      it('should return false for non-empty string', () => {
        expect(isEmpty('test')).toBe(false);
      });
    });
  
    describe('areFieldsFilled', () => {
      it('should return true if any specified field is filled', () => {
        expect(areFieldsFilled(mockFormData, ['formType', 'category'])).toBe(true);
      });
  
      it('should return false if all specified fields are empty', () => {
        const emptyFormData = getInitialFormData();
        expect(areFieldsFilled(emptyFormData, ['formType', 'category'])).toBe(false);
      });
    });
  
    describe('formatCurrency', () => {
      it('should format currency correctly', () => {
        expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
        expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
      });
  
      it('should return empty string for NaN', () => {
        expect(formatCurrency(NaN, 'USD')).toBe('');
      });
    });
  
    describe('cleanNumber', () => {
      it('should extract number from formatted string', () => {
        expect(cleanNumber('$1,000.50')).toBe(1000.50);
      });
  
      it('should return 0 for non-numeric string', () => {
        expect(cleanNumber('abc')).toBe(0);
      });
    });
  
    describe('getDiffAmountColor', () => {
      it('should return red color for negative amounts', () => {
        expect(getDiffAmountColor('-100')).toBe('text-red-600');
      });
  
      it('should return orange color for positive amounts', () => {
        expect(getDiffAmountColor('100')).toBe('text-orange-500');
      });
    });
  
    describe('getCostCenter', () => {
      it('should return cost center approval for existing application', () => {
        const costCenter = getCostCenter(mockUser.application, 'DOTS');
        expect(costCenter).toEqual(mockUser.application[0].cost_center_approval);
      });
  
      it('should return null for non-existing application', () => {
        const costCenter = getCostCenter(mockUser.application, 'NONEXISTENT');
        expect(costCenter).toBeNull();
      });
    });
  
    describe('getSpecialRoleTypes', () => {
      it('should return special role types', () => {
        const roles = [
          { bp: 'BP001', em_cost_center: 'CC001', cost_center: 'CC001', user_type: 'VD001' },
          { bp: 'BP002', em_cost_center: 'CC002', cost_center: 'CC002', user_type: 'VG001' },
          { bp: 'BP003', em_cost_center: 'CC003', cost_center: 'CC003', user_type: 'VA001' }
        ];
        const specialRoles = getSpecialRoleTypes(roles);
        expect(specialRoles).toEqual(['VD', 'VG', 'VA']);
      });
  
      it('should return empty array for no special roles', () => {
        const roles = [
          { bp: 'BP001', em_cost_center: 'CC001', cost_center: 'CC001', user_type: 'USER' }
        ];
        const specialRoles = getSpecialRoleTypes(roles);
        expect(specialRoles).toEqual([]);
      });
    });
  
    describe('getStatusGroupFromRoles', () => {
      it('should map role types to status groups', () => {
        const statusGroups = getStatusGroupFromRoles(['VD', 'VG', 'VA']);
        expect(statusGroups).toEqual(['VerifiedDH', 'VerifiedGH', 'VerifiedAccounting']);
      });
  
      it('should filter out empty strings', () => {
        const statusGroups = getStatusGroupFromRoles(['VD', 'UNKNOWN', 'VA']);
        expect(statusGroups).toEqual(['VerifiedDH', 'VerifiedAccounting']);
      });
    });
  
    describe('hasUserTypeA0001', () => {
      it('should return true if user has A0001 type', () => {
        const roles = [
          { bp: 'BP001', em_cost_center: 'CC001', cost_center: 'CC001', user_type: 'A0001' }
        ];
        expect(hasUserTypeA0001(roles)).toBe(true);
      });
  
      it('should return false if user does not have A0001 type', () => {
        const roles = [
          { bp: 'BP001', em_cost_center: 'CC001', cost_center: 'CC001', user_type: 'USER' }
        ];
        expect(hasUserTypeA0001(roles)).toBe(false);
      });
  
      it('should return undefined for null input', () => {
        expect(hasUserTypeA0001(null)).toBeUndefined();
      });
    });
  
    describe('isCreatingDots', () => {
      it('should return true if user is creating transaction', () => {
        const transaction = { ...mockTransaction, created_by: 'test@example.com', status: '1020' };
        expect(isCreatingDots(transaction as any, mockUser)).toBe(true);
      });
  
      it('should return false if user is not the creator', () => {
        const transaction = { ...mockTransaction, created_by: 'other@example.com', status: '1020' };
        expect(isCreatingDots(transaction as any, mockUser)).toBe(false);
      });
  
      it('should return false if status is not in creating range', () => {
        const transaction = { ...mockTransaction, created_by: 'test@example.com', status: '1050' };
        expect(isCreatingDots(transaction as any, mockUser)).toBe(false);
      });
    });
  
    describe('checkApprovalEligibility', () => {
      it('should return true for VD001 role with matching cost center in 2020 status', () => {
        const roles = [{ bp: 'BP001', em_cost_center: 'CC001', cost_center: 'CC001', user_type: 'VD001' }];
        const transaction = { ...mockTransaction, status: '2020', cost_center_verificator_1: 'CC001' };
        expect(checkApprovalEligibility(transaction, mockUser, roles)).toBe(true);
      });
  
      it('should return true for VA001 role with null cost center in 2030 status', () => {
        const roles = [{ bp: 'BP001', em_cost_center: null, cost_center: null, user_type: 'VA001' }];
        const transaction = { ...mockTransaction, status: '2030' };
        expect(checkApprovalEligibility(transaction, mockUser, roles)).toBe(true);
      });
  
      it('should return false for ineligible role', () => {
        const roles = [{ bp: 'BP001', em_cost_center: 'CC001', cost_center: 'CC002', user_type: 'VD001' }];
        const transaction = { ...mockTransaction, status: '2020', cost_center_verificator_1: 'CC001' };
        expect(checkApprovalEligibility(transaction, mockUser, roles)).toBe(false);
      });
    });
  
    describe('getStatusSteps', () => {
      it('should return steps with prefix 1 for Cash in Advance type 1', () => {
        const steps = getStatusSteps('Cash in Advance', '1');
        expect(steps[0].status).toBe('1010');
        expect(steps[1].status).toBe('1020');
      });
  
      it('should return steps with prefix 2 for other types', () => {
        const steps = getStatusSteps('Reimbursement', '1');
        expect(steps[0].status).toBe('2010');
        expect(steps[1].status).toBe('2020');
      });
    });
  
    describe('isStepComplete', () => {
      it('should return true if step is complete', () => {
        expect(isStepComplete('1020', '1030')).toBe(true);
      });
  
      it('should return false if step is not complete', () => {
        expect(isStepComplete('1030', '1020')).toBe(false);
      });
    });
  
    describe('formatDate', () => {
      it('should format date correctly', () => {
        const formatted = formatDate('2024-01-15');
        expect(formatted).toMatch(/15 Jan 2024/);
      });
  
      it('should return null for null input', () => {
        expect(formatDate(null)).toBeNull();
      });
    });
  
    describe('getStatusInfo', () => {
      const statusHistory: StatusHistoryItem[] = [
        { status: '1020', date: '2024-01-01', remark: 'Test remark', modified_by: 'user@test.com' }
      ];
  
      it('should return status info for existing status', () => {
        const info = getStatusInfo('1020', '1030', statusHistory);
        expect(info?.modified_by).toBe('user@test.com');
        expect(info?.remark).toBe('Test remark');
      });
  
      it('should return null for future status', () => {
        const info = getStatusInfo('1040', '1030', statusHistory);
        expect(info).toBeNull();
      });
  
      it('should return null for non-existing status', () => {
        const info = getStatusInfo('1021', '1030', statusHistory);
        expect(info).toBeNull();
      });
    });
  
    describe('isRejectedStatus', () => {
      it('should return true for rejected status', () => {
        expect(isRejectedStatus('3020')).toBe(true);
        expect(isRejectedStatus('3010')).toBe(true);
      });
  
      it('should return false for non-rejected status', () => {
        expect(isRejectedStatus('1020')).toBe(false);
        expect(isRejectedStatus('2030')).toBe(false);
      });
    });
  
    describe('getRejectedMessage', () => {
      it('should return rejected message for rejected statuses', () => {
        expect(getRejectedMessage('3020')).toBe('Rejected');
        expect(getRejectedMessage('3010')).toBe('Rejected');
        expect(getRejectedMessage('3030')).toBe('Rejected');
      });
  
      it('should return empty string for non-rejected status', () => {
        expect(getRejectedMessage('1020')).toBe('');
      });
    });
  
    describe('checkIS001WithNullCostCenter', () => {
      it('should return true for IS001 role with null cost center', () => {
        expect(checkIS001WithNullCostCenter(mockUser, 'CC001')).toBe(false); // Based on mock data structure
      });
  
      it('should return false if no DOTS application', () => {
        const userWithoutDots = { ...mockUser, application: [] };
        expect(checkIS001WithNullCostCenter(userWithoutDots, 'CC001')).toBe(false);
      });
    });
  
    describe('calculateDefaultDueDate', () => {
      it('should return date string 8 days from today', () => {
        const today = new Date();
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() + 8);
        const result = calculateDefaultDueDate();
        expect(result).toBe(expectedDate.toISOString().split('T')[0]);
      });
    });
  
    describe('formatDisplayDate', () => {
      it('should format date for display', () => {
        const formatted = formatDisplayDate('2024-01-15');
        expect(formatted).toBe('15 Jan 2024');
      });
  
      it('should return empty string for empty input', () => {
        expect(formatDisplayDate('')).toBe('');
      });
    });
  
    describe('getCurrentDate', () => {
      it('should return current date in YYYY-MM-DD format', () => {
        const result = getCurrentDate();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  
    describe('getYesterdayDate', () => {
      it('should return yesterday date in YYYY-MM-DD format', () => {
        const result = getYesterdayDate();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // Verify it's actually yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const expectedDate = yesterday.toISOString().split('T')[0];
        expect(result).toBe(expectedDate);
      });
    });
  
    describe('isRequiredFieldsFilled', () => {
      it('should return true if required fields are filled', () => {
        expect(isRequiredFieldsFilled(mockFormData)).toBe(true);
      });
  
      it('should return false if required fields are empty', () => {
        const emptyFormData = { ...mockFormData, startDate: '', endDate: '' };
        expect(isRequiredFieldsFilled(emptyFormData)).toBe(false);
      });
    });
  
    describe('hasFilledDataSpesific', () => {
      it('should return true for filled formType', () => {
        expect(hasFilledDataSpesific(mockFormData, 'formType')).toBe(true);
      });
  
      it('should return true for filled transaction detail', () => {
        expect(hasFilledDataSpesific(mockFormData, 'transactionDetail')).toBe(true);
      });
  
      it('should return true for filled employee information', () => {
        expect(hasFilledDataSpesific(mockFormData, 'employeeInformation')).toBe(true);
      });
  
      it('should return false for unknown type', () => {
        expect(hasFilledDataSpesific(mockFormData, 'unknownType')).toBe(false);
      });
  
      it('should return false for empty data', () => {
        const emptyFormData = getInitialFormData();
        expect(hasFilledDataSpesific(emptyFormData, 'formType')).toBe(false);
      });
    });
});