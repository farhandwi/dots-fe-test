// Define TransactionType
export type TransactionType = 'employee' | 'vendor' | null;

// Define CostCenter type
export type CostCenter = {
  cost_center: string;
  cost_center_name: string;
};

// Define FormData interface
export interface FormData {
  formType: string;
  category: string;
  invoiceNumber: string;
  memoNumber: string;
  memoLink: string;
  startDate: string;
  endDate: string;
  event: string;
  address: string;
  purpose: string;
  policyNumber: string;
  clientNumber: string;
  clientName: string;
  region_group: string;
  destination_scope: string;
  costCenterInputter: string;

  // Employee Info fields
  businessPartner: string;
  employeeNIP: string;
  employeeName: string;
  employeeEmail: string;
  costCenterDesc: string;
  costCenter: string;

  // Payment Information fields
  currency: string;
  paymentType: string;
  estimatePaymentDueDate: string;
  paymentRemark: string;
  bankAccountNo: string;
  bankName: string;
  accountName: string;
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


// Define RoleItem type
export type RoleItem = {
  cost_center: string;
  type: string;
  user_type: string;
};

// Define User type
export type User = {
    partner: string;
    email: string;
    application: Array<{
    role: RoleItem[] & string;
  }>;
};

export type employeeData = {
    nip: string;
    partner: string;
    name_first: string;
    cost_center: string;
    division: string;
    email: string;
    exp_date: Date | null;
}
  

export type PropsEmployee = {
  formData: FormData;
  currentStep: number;
  dotsType: string | null | undefined;
  partner: string | null | undefined;
  renderStepEmployeeIndicator: () => JSX.Element;
  renderEmployeeInformation: () => JSX.Element;
  renderTransactionDetail: () => JSX.Element;
  renderDestinationStep: () => JSX.Element;
  renderPaymentInformation: () => JSX.Element;
  renderAdditionalInformation: () => JSX.Element;
  renderFinishEmployee: () => JSX.Element;
  renderInitialStep: () => JSX.Element;
  renderCategoryStep: () => JSX.Element;
  renderCostCenterStep: () => JSX.Element;
  renderPaymentSpecialInformation: () => JSX.Element;
};

export type propsTransactionDetail = {
    formData: FormData,
    setFormData: (value: FormData) => void;
}

export type PropsVendor = {
  currentStep: number;
  dotsType: string | null | undefined;
  partner: string | null | undefined;
  renderStepEmployeeIndicator: () => JSX.Element;
  renderVendorDestinationInformation: () => JSX.Element;
  renderEmployeeInformation: () => JSX.Element;
  renderTransactionDetail: () => JSX.Element;
  renderVendorInformation: () => JSX.Element;
  renderPaymentInformation: () => JSX.Element;
  renderAdditionalInformation: () => JSX.Element;
  renderFinishVendor: () => JSX.Element;
  renderCostCenterStep: () => JSX.Element;
};

export type Vendor = {
    PARTNER: string;
    NAME1: string;
    STREET: string;
    CITY: string;
}

export interface BankDetail {
    Partner: string;
    Banks: string;
    Banka: string;
    Bkref: string;
    Koinh: string;
    Bankn: string;
  }

export interface ApiBankResponse {
  data_result: BankDetail[];
}
  
export interface PaymentFormProps {
    bp: string;
    dotsType: 'Employee' | 'Vendor';
    formData: FormData,
    setFormData: (value: FormData) => void;
  }

export type VendorTypes = Vendor[];