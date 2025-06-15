import { Transaction } from '../../types/transaction';
type User = {
    partner: string;
    profile_image: string;
    name: string;
    email: string;
    application: Application[];
};

interface CostCenterApproval {
    cost_center: string;
    approval1: string;
    approval2: string;
}

export interface FormData {
    formType: string;
    category: string;
    memoNumber: string;
    memoLink: string;
    startDate: string;
    endDate: string;
    event: string;
    address: string;
    purpose: string;
    policyNumber: string;
    invoiceNumber: string;
    clientName: string;
    businessPartner: string;
    employeeNIP: string;
    employeeName: string;
    employeeEmail: string;
    costCenterDesc: string;
    clientNumber: string;
    costCenter: string;
    currency: string;
    paymentType: string;
    estimatePaymentDueDate: string;
    paymentRemark: string;
    bankAccountNo: string;
    bankName: string;
    accountName: string;
    destination_scope: string;
    region_group: string;
    costCenterInputter: string;
}

interface Role {
    bp: string;
    em_cost_center: string | null;
    cost_center: string | null;
    user_type: string;
}

export interface StatusStep {
    step: number;
    status: string;
    label: string;
}

export interface TransactionProgressProps {
    formType: string;
    currentStatus: string;
    trx_type: string;
    dotsNumber: string;
}

export interface StatusInfo {
    date: string | null;
    remark: string | null;
    modified_by: string;
}

export type TransactionNonInsurance = {
    BUKRS: string;
    dots_number: string;
    dots_no_hash: string;
    purch_org: string;
    purch_group: string;
    memo?: string;
    memo_link?: string;
    category: string;
    form_type: string;
    trx_type: string;
    bpid: string;
    employee_name: string;
    employee_nip: string;
    division?: string;
    cost_center_bp: string;
    cost_center_verificator_1: string;
    cost_center_verificator_2: string;
    cost_center_verificator_3: string;
    cost_center_verificator_4: string;
    cost_center_verificator_5: string;
    destination_scope: string;
    region_group?: string;
    cost_center_inputter: string;
    client_bpid?: string;
    client_name?: string;
    destination?: string;
    event?: string;
    purpose: string;
    address?: string;
    start_date: string;
    end_date: string;
    invoice_number?: string;
    pol_number?: string;
    curr_id?: string;
    total_proposed_amt?: number;
    total_realization_amt?: number;
    total_diff_amt?: number;
    payment_type: string;
    estimate_payment_due_date?: string;
    employee_bank_name: string;
    employee_acct_bank_number: string;
    employee_acct_bank_name: string;
    employee_cash_card?: string;
    employee_email: string;
    employee_acct_swift_code?: string;
    employee_acct_iban?: string;
    remark_payment?: string;
    sap_dp_request_no?: string;
    sap_dp_request_year?: string;
    sap_po_doc_no?: string;
    sap_po_doc_year?: string;
    sap_acc_doc_no?: string;
    sap_acc_doc_year?: string;
    status_desc?:string;
    sap_invoice_number?: string;
    sap_invoice_year?: string;
    status: string;
    created_by: string;
    created_date: string;
    modified_by: string | undefined;
    modified_date: string;
};

export interface StatusHistoryItem {
    status: string;
    date: string;
    remark: string | null;
    modified_by: string;
}
  
interface Application {
    application_id: number;
    app_name: string;
    alias: string;
    url: string;
    is_active: number;
    role: Role[];
    cost_center_approval: {
      cost_center: string;
      approval1: string;
      approval2: string;
      approval3: string;
      approval4: string;
      approval5: string;
    };
}

export const hasDotsAdminRole = (user: User): boolean => {
    const dotsApp = user.application.find(app => app.app_name === "DOTS");
    return dotsApp?.role.some(role => role.user_type === "A0001") || false;
};
  
export const isActive = (expiredDate: string | null): boolean => {
    if (expiredDate === null) return true;
    const today = new Date();
    const expired = new Date(expiredDate);
    return expired > today;
};

export const getTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      'ZMIN': 'bg-red-100 text-red-800',
      'ZMNI': 'bg-blue-100 text-blue-800',
      'ZMNV': 'bg-orange-100 text-black',
      'ZSRV': 'bg-pink-100 text-orange-800',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

export const getInitialFormData = (): FormData => ({
    formType: '',
    category: '',
    memoNumber: '',
    memoLink: '',
    startDate: '',
    endDate: '',
    event: '',
    address: '',
    purpose: '',
    policyNumber: '',
    invoiceNumber: '',
    clientName: '',
    businessPartner: '',
    employeeNIP: '',
    employeeName: '',
    employeeEmail: '',
    costCenterDesc: '',
    clientNumber: '',
    costCenter: '',
    currency: '',
    paymentType: '',
    estimatePaymentDueDate: '',
    paymentRemark: '',
    bankAccountNo: '',
    bankName: '',
    accountName: '',
    destination_scope: '',
    region_group: '',
    costCenterInputter: ''
});

export function getRolesByApplicationName(
    applications: Application[],
    targetName: string
  ): Role[] | null {
    const app = applications.find((app) => app.app_name === targetName);
    return app ? app.role : null;
}

export const hasFilledData = (formData: FormData) => {
    return Object.values(formData).some(value => 
      value !== '' && 
      value !== null && 
      value !== undefined
    );
};

export const isEmpty = (value: string): boolean => {
    return value === '' || value === null || value === undefined;
  };

export const areFieldsFilled = (formData: FormData, fields: (keyof FormData)[]): boolean => {
    return fields.some((field:(keyof FormData)) => formData[field] !== null && formData[field] !== '' && formData[field] !== undefined);
};

export const hasFilledDataSpesific = (formData: FormData, type: string): boolean => {
    switch (type) {
      case 'formType':
        return !isEmpty(formData.formType) || formData.formType !== '';
      case 'category':
        return !isEmpty(formData.category) || formData.category !== '';
      case 'costCenterInputter':
        return !isEmpty(formData.costCenterInputter) || formData.costCenterInputter !== '';
      case 'costCenter':
        return !isEmpty(formData.costCenter) && !isEmpty(formData.costCenterDesc) || formData.costCenter !== '' || formData.costCenterDesc !== '';
      case 'destinationInformation':
        return !isEmpty(formData.destination_scope) || !isEmpty(formData.region_group)
      case 'transactionDetail':
        return areFieldsFilled(formData, [
          'memoNumber',
          'memoLink',
          'startDate',
          'endDate'
        ]);
      case 'employeeInformation':
        return areFieldsFilled(formData, [
          'businessPartner',
          'employeeNIP',
          'employeeName',
          'employeeEmail'
        ]);
      case 'vendorInformation':
        return areFieldsFilled(formData, [
          'clientNumber',
          'clientName',
          'address'
        ]);
      case 'paymentInformation':
        return areFieldsFilled(formData, [
          'currency',
          'paymentType',
          'estimatePaymentDueDate',
          'paymentRemark',
          'bankAccountNo',
          'bankName',
          'accountName'
        ]);
      case 'additionalInformation':
        return areFieldsFilled(formData, [
          'event',
          'purpose'
        ]);
      default:
        return false;
    }
};

export const formatCurrency = (value: number, currency: string): string => {
    if (isNaN(value)) return '';
    return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
    }).format(value);
};

export const cleanNumber = (value: string): number => {
    const cleaned = value.replace(/[^\d.-]/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
};

export const getDiffAmountColor = (diffAmount: string) => {
    const amount = parseFloat(diffAmount);
    if (amount < 0) return "text-red-600";
    return "text-orange-500";
};

export function getCostCenter(
    applications: Application[],
    targetName: string
  ): CostCenterApproval | null {
    const app = applications.find((app) => app.app_name === targetName);
    return app ? app.cost_center_approval : null;
}

export const getSpecialRoleTypes = (role: Role[]) => {
    if (!role) return [];

    const roleTypes = role.map(
      (r: Role) => r.user_type
    );
    const specialRoles = [];

    if (roleTypes.some((r) => r.startsWith("VD")))
      specialRoles.push("VD");
    if (roleTypes.some((r) => r.startsWith("VG")))
      specialRoles.push("VG");
    if (roleTypes.some((r) => r.startsWith("VA")))
      specialRoles.push("VA");

    return specialRoles;
};

export const getStatusGroupFromRoles = (roleTypes: string[]) => {
    return roleTypes
      .map((roleType) => {
        switch (roleType) {
          case "VD":
            return "VerifiedDH";
          case "VG":
            return "VerifiedGH";
          case "VA":
            return "VerifiedAccounting";
          default:
            return "";
        }
      })
      .filter((status) => status !== "");
};

export function hasUserTypeA0001(data: Role[] | null):boolean | undefined {
    return data?.some(item => item.user_type === 'A0001');
}

export function isCreatingDots(transaction: Transaction, user: User):boolean{
    if (!transaction) return false;
    if (
      (transaction.created_by.toLowerCase() === user.email.toLowerCase() &&
      ['1020', '2020', '1021', '2021', '1030', '2030'].includes(transaction.status))
    ) {
      return true;
    }

    return false;
}

export function checkApprovalEligibility(transaction: TransactionNonInsurance, user: User, role:Role[]): boolean {
    if (!role || !transaction) return false;

    if (["2020", "1020"].includes(transaction.status)) {
      return role.some(
        (roleItem) =>
          (roleItem.user_type === "VD001" &&
          roleItem.cost_center &&
          roleItem.cost_center === transaction.cost_center_verificator_1) ||
          (roleItem.user_type === "VG001" &&
          roleItem.cost_center &&
          (transaction.cost_center_verificator_2 === null && roleItem.cost_center === transaction.cost_center_verificator_1))
      );
    }
  
    if (["2021", "1021"].includes(transaction.status)) {
      return role.some(
        (roleItem) =>
          (roleItem.user_type === "VG001" &&
          roleItem.cost_center &&
          (roleItem.cost_center === transaction.cost_center_verificator_2)) || (roleItem.user_type === "VG001" && (transaction.cost_center_verificator_2 === null) && (roleItem.cost_center === transaction.cost_center_verificator_1))
      );
    }

    if (["2030", "1030","2040", "1040"].includes(transaction.status)) {
      return role.some(role => role.user_type === 'VA001' && role.cost_center === null);
    }
  
    return false;
}

export const getStatusSteps = (formType: string, trx_type: string): StatusStep[] => {
    const prefix = (formType === 'Cash in Advance' && trx_type === '1') ? '1' : '2';
    
    return [
      { step: 1, status: `${prefix}010`, label: 'Initial' },
      { step: 2, status: `${prefix}020`, label: 'Waiting Approval 1' },
      { step: 3, status: `${prefix}021`, label: 'Waiting Approval 2' },
      { step: 4, status: `${prefix}030`, label: 'Waiting Accounting Verification' },
      { step: 5, status: `${prefix}040`, label: 'Verified' },
      { step: 6, status: `${prefix}050`, label: 'SAP Created' },
      { step: 7, status: `${prefix}060`, label: 'Paid' }
    ];
};


export const isStepComplete = (stepStatus: string, currentStatus: string): boolean => {
    const currentStatusNum = parseInt(currentStatus.slice(1));
    const stepStatusNum = parseInt(stepStatus.slice(1));
    return stepStatusNum <= currentStatusNum;
};

export const formatDate = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const getStatusInfo = (status: string, currentStatus: string, statusHistory: StatusHistoryItem[]): StatusInfo | null => {
    const statusNum = parseInt(status.slice(1));
    const latestStatusNum = parseInt(currentStatus.slice(1));

    if (statusNum > latestStatusNum) {
        return null;
    }

    const historyItem = statusHistory.find(h => h.status === status);
    return historyItem ? {
        date: formatDate(historyItem.date),
        remark: historyItem.remark,
        modified_by: historyItem.modified_by
    } : null;
};

export const isRejectedStatus = (status: string): boolean => {
    return status.startsWith('3');
};

export const getRejectedMessage = (status: string): string => {
    if (status === '3020') return 'Rejected';
    if (status === '3010') return 'Rejected';
    if (status === '3030') return 'Rejected';
    return '';
};

export const checkIS001WithNullCostCenter = (user: User, selectedInputterCostCenter: string) => {
    const targetName = "DOTS";
    const roleDots = getRolesByApplicationName(user?.application, targetName);
    if (!roleDots) return false;

    const filteredRoles = selectedInputterCostCenter
        ? roleDots.filter(role => role.em_cost_center === selectedInputterCostCenter)
        : roleDots;

    return filteredRoles.some(role => 
        role.user_type === 'IS001' && role.cost_center === null
    );
};

export const calculateDefaultDueDate = () => {
    const today = new Date();
    const defaultDueDate = new Date(today);
    defaultDueDate.setDate(today.getDate() + 8);
    const dataDueDate= defaultDueDate.toISOString().split('T')[0];
    return dataDueDate;
};

export const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
};

export const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const isRequiredFieldsFilled = (formData: FormData): boolean => {
    return !!(
        formData.startDate &&
        formData.endDate 
    );
};