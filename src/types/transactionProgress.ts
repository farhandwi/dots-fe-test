export interface TransactionLog {
    BUKRS: string;
    dots_number: string;
    seq_number: number;
    trx_type: string;
    status: string;
    modified_by: string;
    modified_date: string;
    remark: string | null;
}

export interface StatusHistoryItem {
    status: string;
    date: string;
    remark: string | null;
    modified_by: string;
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