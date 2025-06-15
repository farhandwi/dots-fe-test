import axios from 'axios';
import { toast } from 'react-toastify';
import { FormData } from '../../types/newDots';
import { AxiosInstance } from 'axios';

interface Role {
    bp: string;
    cost_center: string | null;
    user_type: string;
}

interface cost_center_approval {
    cost_center: string;
    approval1: string;
    approval2: string | null;
    approval3: string | null;
    approval4: string | null;
    approval5: string | null;
}

interface CostCenterApprovalResponse {
    cost_center_approval: {
        bp: string;
        email: string;
        name: string;
        cost_center: string;
        approval1: string;
        approval2: string | null;
        approval3: string | null;
        approval4: string | null;
        approval5: string | null;
    }
}

interface Application {
    application_id: number;
    app_name: string;
    alias: string;
    url: string;
    is_active: number;
    role: Role[] | null; 
    cost_center_approval: cost_center_approval
}
  
type User = {
    partner: string;
    email: string;
    cost_center: string;
    application: Application[];
};

function getRolesByApplicationName(
    applications: Application[] | undefined,
    targetName: string
  ): cost_center_approval | null {
    const app = applications?.find((app) => app.app_name === targetName);
    return app ? app.cost_center_approval : null;
  }

// Helpers yang tidak menggunakan hooks
const getStatus = (formType: string, doc_type: string | null) => {
    if(doc_type == 'vendor'){
        return '2010';
    }else{
        switch (formType) {
            case 'Cash in Advance':
                return '1010';
            case 'Disbursement':
                return '2010';
            default:
                return 'err';
        }
    }
};

const getFormData = (formType: string, doc_type: string | null) => {
    if(doc_type == 'vendor'){
        return 'R';
    }else{
        switch (formType) {
            case 'Cash in Advance':
                return 'C';
            case 'Disbursement':
                return 'R';
            default:
                return 'err';
        }
    }
};
const getTrxType = (transactionType: string, doc_type: string | null) => {
    if(doc_type == 'vendor'){
        return '2';
    }else{
        switch (transactionType) {
            case 'Cash in Advance':
                return '1';
            case 'Disbursement':
                return '2';
            default:
                return 'err';
        }
    }
};

const getPaymentType = (paymentType: string) => {
    switch (paymentType) {
        case 'Transfer':
            return 'T';
        case 'Cash':
            return 'C';
        case 'Block for payment':
            return 'B';
        default:
            return 'err';
    }
};

const getCategory = (category: string, doc_type: string | null) => {
    if(doc_type == 'vendor'){
        return 'V';
    }else{
        switch (category) {
            case 'Cash Card':
                return 'A';
            case 'Corporate Card':
                return 'B';
            case 'Compensation & Benefit':
                return 'C';
            case 'Business Event':
                return 'D';
            case 'Business Trip':
                return 'H';
            case 'Reimbursement':
                return 'R';
            default:
                return category;
        }
    }
};

// Hook untuk submit transaction
export const useSubmitTransaction = () => {
    const submitTransaction = async (
        formData: FormData, 
        doc_type: string|null, 
        user: User | null,
        axiosJWT: AxiosInstance
    ) => {
        const DotsEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
        const targetName = "DOTS";
        let costCenterApproval: cost_center_approval | null = getRolesByApplicationName(user?.application, targetName) ?? null;
        const category = getCategory(formData.category, doc_type);
        const form_type  = getFormData(formData.formType, doc_type);
        const trx_type = getTrxType(formData.formType, doc_type);
        if(doc_type === 'vendor'){
            formData.destination_scope = 'domestic';
            formData.region_group = '';
        }

        try {
            if (category !== 'C') {
                try {
                    const response = await axiosJWT.get<CostCenterApprovalResponse>(
                        `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/cost-center-approval/${formData.businessPartner}`
                    );

                    costCenterApproval = {
                        cost_center: response.data.cost_center_approval.cost_center,
                        approval1: response.data.cost_center_approval.approval1,
                        approval2: response.data.cost_center_approval.approval2 || null,
                        approval3: response.data.cost_center_approval.approval3 || null,
                        approval4: response.data.cost_center_approval.approval4 || null,
                        approval5: response.data.cost_center_approval.approval5 || null
                    };
                } catch (error) {
                    console.error('Error fetching cost center approval:', error);
                    toast.error('Failed to retrieve cost center approval data');
                    throw error;
                }
            }

            let queryParams: Record<string, string> = {};
            let finalDocType = doc_type;

            if (doc_type === 'vendor') {
                finalDocType = 'V';
                queryParams = {
                    doc_type: 'V'
                };
            } else if (doc_type === 'employee') {
                finalDocType = 'E';
                queryParams = {
                    doc_type: 'E'
                };
            }

            const payload = {
                BUKRS: 'TUGU', 
                purch_org: "PRC1",
                purch_group: "202",
                memo: formData.memoNumber,
                memo_link: formData.memoLink,
                category: category,
                form_type: form_type,
                trx_type: trx_type,

                bpid: formData.businessPartner,
                employee_name: formData.employeeName,
                employee_nip: formData.employeeNIP,
                division: formData.costCenterDesc,
                cost_center_bp: formData.costCenter,
                cost_center_verificator_1: costCenterApproval?.approval1,
                cost_center_verificator_2: costCenterApproval?.approval2,
                cost_center_verificator_3: costCenterApproval?.approval3,
                cost_center_verificator_4: costCenterApproval?.approval4,
                cost_center_verificator_5: costCenterApproval?.approval5,
                cost_center_inputter: user?.cost_center,
                employee_email: formData.employeeEmail,
                destination_scope: formData.destination_scope,
                region_group: formData.region_group,

                client_bpid: formData.clientNumber,
                client_name: formData.clientName,
                
                destination: '',
                event: formData.event,
                purpose: formData.purpose,
                address: formData.address,
                start_date: formData.startDate,
                end_date: formData.endDate,
                invoice_number: formData.invoiceNumber,
                pol_number: formData.policyNumber,

                curr_id: formData.currency,
                payment_type: getPaymentType(formData.paymentType),
                estimate_payment_due_date: formData.estimatePaymentDueDate,
                remark_payment: formData.paymentRemark,
                
                employee_bank_name: formData.bankName,
                employee_acct_bank_number: formData.bankAccountNo,
                employee_acct_bank_name: formData.accountName,
                
                total_proposed_amt: null,
                total_realization_amt: null,
                total_diff_amt: null,
                employee_cash_card: null,
                employee_acct_swift_code: null,
                employee_acct_iban: null,
                sap_dp_request_no: null,
                sap_dp_request_year: null,
                sap_po_doc_no: null,
                sap_po_doc_year: null,
                sap_acc_doc_no: null,
                sap_acc_doc_year: null,
                sap_invoice_number: null,
                sap_invoice_year: null,
                status: getStatus(formData.formType, doc_type),
                
                created_by: user?.email, 
                created_date: new Date().toISOString(),
                modified_by: user?.email, 
                modified_date: new Date().toISOString()
            };

            // Construct URL with query parameters
            const queryString = new URLSearchParams(queryParams).toString();
            console.log('payload', payload);
            const url = `${DotsEndPoint}/transaction-non-insurance${queryString ? `?${queryString}` : ''}`;

            const response = await axiosJWT.post(url, payload);

            toast.success('DOTS successfully created', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    const errorDesc = error.response.data.error_desc;
                    
                    if (typeof errorDesc === 'object') {
                        const errorMessages = Object.values(errorDesc)
                            .flat()
                            .join('\n');
                        
                        toast.error(errorMessages, {
                            style: { whiteSpace: 'pre-line' } 
                        });
                    } else {
                        toast.error(errorDesc || 'Failed to make DOTS');
                    }
                } else if (error.request) {
                    toast.error('No response from server');
                } else {
                    toast.error('An error occurred in processing the transaction');
                }
            } else {
                toast.error('An unknown error occurred');
            }
            throw error;
        }
    };

    return { submitTransaction };
};