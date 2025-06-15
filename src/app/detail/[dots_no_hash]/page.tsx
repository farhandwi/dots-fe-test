'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, CreditCard, Building, Loader2, FileText, FileEdit, RefreshCcw, Check, X, Receipt, History, Building2, Layers, Users2, UserX, UserCircle, Mail, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import MFilesSection from '@/components/detail/MFiles';
import { redirect } from 'next/navigation';
import DeleteModal from '@/components/DeleteModal'; 
import { useState, useEffect } from 'react';
import MaterialItemsTable from '@/components/detail/MaterialDetilTable';
import GlItemsTable from '@/components/detail/GlDetilTable';
import TransactionProgress from '@/components/detail/TransactionProgress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layout } from '@/components/Layout';
import Swal from 'sweetalert2'
import { useAuth } from "@/lib/auth-context";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TransactionNonInsurance } from '@/types/newDots';
import axios, { AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import Image from 'next/image';
import { MaterialItem } from '@/types/material';
import { lowerCase } from 'lodash';

interface DecodedToken {
    exp: number;
}

type Approval = {
  name: string;
  title: string;
  email: string;
  bp: string;
  approval_level: number;
  cost_center: string;
  cost_center_name: string;
};

type ApprovalData = {
  approval1: Approval[];
  approval2: Approval[];
};

interface TransactionLog {
  BUKRS: string;
  dots_number: string;
  seq_number: number;
  trx_type: string;
  status: string;
  status_desc: string;
  modified_by: string;
  modified_date: string;
  remark: string | null;
}

type User = {
  partner: string;
  email: string;
  application: Application[];
};

interface Role {
  bp: string;
  cost_center: string | null;
  user_type: string;
}

type CostCenterApproval = {
  approval1: string;
  approval2: string;
  approval3: string;
  approval4: string;
  approval5: string;
}

interface Application {
  app_id: string;
  app_name: string;
  app_url: string;
  is_active: number;
  role: Role[];
  cost_center_approval: CostCenterApproval;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      error_message?: string;
      error?: Record<string, string[]>;
    };
    status?: number;
  };
  message: string;
}

export default function TransactionDetail({
  params
}: {
  params: { dots_no_hash: string }
}) {
  const { user } = useAuth() as {
    user: User;
  };
  const DotsEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const BpmsEndPoint = process.env.NEXT_PUBLIC_BPMS_BE_END_POINT;

  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionNonInsurance>({
    BUKRS: '',
    dots_number: '',
    dots_no_hash: '',
    purch_org: '',
    purch_group: '',
    category: '',
    form_type: '',
    trx_type: '',
    pol_number: '',
    bpid: '',
    employee_name: '',
    employee_nip: '',
    cost_center_bp: '',
    cost_center_verificator_1: '',
    cost_center_verificator_2: '',
    cost_center_verificator_3: '',
    cost_center_verificator_4: '',
    cost_center_verificator_5: '',
    destination_scope: '',
    cost_center_inputter: '',
    purpose: '',
    start_date: '',
    end_date: '',
    payment_type: '',
    employee_bank_name: '',
    employee_acct_bank_number: '',
    employee_acct_bank_name: '',
    employee_email: '',
    status: '',
    created_by: '',
    created_date: '',
    modified_by: '',
    modified_date: '',
  });
  const [revisionNotes, setRevisionNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);
  const [listDotsApproval, setListDotsApproval] = useState<ApprovalData>({approval1:[], approval2:[]});
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role[] | null>([]);
  const [listApproval, setListApproval] = useState<CostCenterApproval | null>();
  const [materialGroup, setMaterialGroup] = useState<Array<string>>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const EndpointBE = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const [groupCode, setGroupCode] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(false);
  const [isUploadMFiles, setIsUploadMFiles] = useState<boolean | undefined>(false);
  const [materialData, setMaterialData] = useState<MaterialItem[]>([]);

  function getRolesByApplicationName(
    applications: Application[],
    targetName: string
  ): Role[] | null {
    const app = applications.find((app) => app.app_name === targetName);
    return app ? app.role : null;
  }

  function hasUserTypeA0001(data: Role[] | null):boolean | undefined {
    return data?.some(item => item.user_type === 'A0001');
  }

  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [expire, setExpire] = useState<number | null>(null);
  const APIEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;

  useEffect(() => {
    let isMounted = true;
    const refreshToken = async () => {
      if (token && expire && expire > Date.now() / 1000) {
          setIsTokenLoading(false);
          return;
      }

      try {
        const response = await axios.get(`${APIEndpoint}/token`, { 
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        if (isMounted) {
          const newToken = response.data.data.token;
          setToken(newToken);
          const decoded: DecodedToken = jwtDecode(newToken);
          setExpire(decoded.exp);
          setIsTokenLoading(false);
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    };

    refreshToken();

    return () => {
      isMounted = false;
    };
  }, []); 

  const axiosJWT = useAxiosJWT({
    token,
    expire,
    setToken,
    setExpire,
    APIEndpoint
  });

  useEffect(() => {
    async function fetchTransactionAndLogs() {
      try {
        setIsLoading(true);
        const transactionRes = await axiosJWT.get(
          `${DotsEndPoint}/get/transaction-non-insurance/${params.dots_no_hash}`
        );
  
        if (transactionRes.status !== 200) {
          throw new Error('Failed to fetch transaction');
        }
  
        const transactionData = transactionRes.data;
        setTransaction(transactionData);
        
        if (transactionData?.dots_number) {
          const logsRes = await axiosJWT.get(
            `${DotsEndPoint}/transaction-logs?BUKRS=TUGU&dots_number=${transactionData.dots_number}`,
          );
          if (logsRes.status === 200) {
            const logsData = logsRes.data;
            setTransactionLogs(logsData.data || []);
          }
          let response = null;
          let dataListApproval = null;
          if(transactionData.category === 'Compensation & Benefit'){
            const responseCompen = await axios({
              method: "GET",
              url: `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/bp/email/${transactionData.created_by}`,
            });
  
            if(responseCompen.status === 200){
              const BpCompensation = responseCompen.data.data[0].BP;
              response = await axiosJWT.get(
                `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/cost-center-approval/${BpCompensation}`
              );
              dataListApproval = response.data.cost_center_approval;
            }else{
              response = null;
            }
          }else{
            response = await axiosJWT.get(
              `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/cost-center-approval/${transactionData.bpid}`
            );
            dataListApproval = response.data.cost_center_approval;
          }
          const approvals = {
            approval1: dataListApproval.approval1,
            approval2: dataListApproval.approval2,
            approval3: dataListApproval.approval3,
            approval4: dataListApproval.approval4,
            approval5: dataListApproval.approval5
          };
          setListApproval(approvals);
          setGroupCode(dataListApproval.approval2 || dataListApproval.approval1);
  
          if(response?.status === 200){
            try {
              const listApproval = await axiosJWT.post(
                `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/dots-approval`, dataListApproval
              );
              setListDotsApproval(listApproval.data.data);
            } catch (approverErr) {
              console.error('Failed to fetch approvers:', approverErr);
            }
          }
        }
        const targetName = "DOTS";
        const roles = getRolesByApplicationName(user?.application, targetName);
        setRole(roles);
  
        const viewAdmin = hasUserTypeA0001(roles);
        setIsAdmin(viewAdmin);
  
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  
    if(!isTokenLoading && user ){
      fetchTransactionAndLogs();
    }
  
  }, [params.dots_no_hash, user, token, axiosJWT, isTokenLoading]);

  function isCreatingDots():boolean{
    if (!transaction) return false;
    if (
      (transaction.created_by.toLowerCase() === user.email.toLowerCase() &&
      ['1020', '2020', '1021', '2021', '1030', '2030'].includes(transaction.status))
    ) {
      return true;
    }

    return false;
  }

  function checkApprovalEligibility(): boolean {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading transaction...</span>
      </div>
    );
  }

  // if (error) {
  //   return <div>Error: {error}</div>;
  // }

  if (!transaction) {
    redirect('/404');
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const disableRequestApproval = () => {
    if((materialGroup.length > 0) && isUploadMFiles === true){
      return false;
    }else{
      return true;
    }
  }

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: transaction?.curr_id || 'IDR'
    }).format(amount);
  };

  const handleUpdate = () => {
    router.push(`/detail/update/${transaction?.dots_no_hash}`);
  };

  const handleDelete = () => {
    if(!role){
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (remark: string) => {
    try {
      const response = await axiosJWT.delete(`${DotsEndPoint}/transaction-non-insurance`, {
        data: {
          dots_number: transaction.dots_number,
          role: role,
          email: user?.email,
          remark: remark
        }
      });
      
      if (response.status !== 200) {
        const errorData = response.data;
        setIsDeleteModalOpen(false);
  
        await Swal.fire({
          title: 'Error!',
          text: response.data.message ?? "Something went wrong!",
          icon: "error",
          confirmButtonText: 'OK'
        });
        throw new Error(errorData.error_message || 'Failed to delete transaction');
      }
  
      setIsDeleteModalOpen(false);
  
      await Swal.fire({
        title: 'Deleted!',
        text: 'Transaction has been deleted successfully.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
  
      router.push('/show');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error; 
    }
  };

  const handleApprove = async () => {
    if (!user) return;

    let roleTypes: string[];
    if (["1020", "2020"].includes(transaction.status)) {
      roleTypes = ["VD001", "VG001"];
    } else if (["1021", "2021"].includes(transaction.status)) {
      roleTypes = ["VG001"];
    } else if (["1030", "2030"].includes(transaction.status)) {
      roleTypes = ["VA001"];
    } else {
      console.error("Invalid status for approval");
      return;
    }

    if(role){
      const roleObject = role?.find(
        (r) => roleTypes.includes(r.user_type)
      );
      if (!roleObject) {
        console.error("Required role not found");
        return;
      }
    }
  
    try {
      const result = await Swal.fire({
        title: 'Approve Transaction',
        text: `Are you sure you want to approve transaction ${transaction.dots_number}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'Cancel',
        customClass: {
          container: 'z-[1400]' 
        }
      });
  
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Processing',
          text: 'Approving transaction...',
          icon: 'info',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            container: 'z-[1400]'
          }
        });

        let response;

        if(transaction.category !== 'Compensation & Benefit'){
          response = await axiosJWT.post(
            `${EndpointBE}/dots/approval/${user.email}/${transaction.dots_number}`,
            { roles: role, remark: null, cost_center_approval: listApproval }
          );
        }else{
          const responseRoleAll = await axios({
            method: "GET",
            url: `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/role/all/${transaction.created_by}`,
          });

          if(responseRoleAll.status === 200){
            const cost_center_approval = responseRoleAll.data.toa.find((item:Application) => item.app_name === "DOTS")?.cost_center_approval;
            response = await axiosJWT.post(
              `${EndpointBE}/dots/approval/${user.email}/${transaction.dots_number}`,
              { roles: role, remark: null, cost_center_approval: cost_center_approval }
            );
          }else{
              await Swal.fire({
                title: 'Error!',
                text: 'Failed to approve transaction. Please try again.',
                icon: 'error',
                customClass: {
                  container: 'z-[1400]'
                }
              });
              throw new Error("Failed to update transaction");
          }
        }


        if (response?.status === 200) {
          await Swal.fire({
            title: 'Berhasil!',
            text: 'Transaction successfully approved.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            window.location.reload(); 
          });
        }else{
          await Swal.fire({
            title: 'Error!',
            text: 'Failed to approve transaction. Please try again.',
            icon: 'error',
            customClass: {
              container: 'z-[1400]'
            }
          });
        }
      }
    } catch (error: unknown) {
      console.error("Error rejecting transaction:", error);
      
      const isApiError = (error: unknown): error is ApiErrorResponse => {
        return (
          typeof error === 'object' &&
          error !== null &&
          ('response' in error || 'message' in error)
        );
      };

      const errorMessage = isApiError(error)
        ? error.response?.data?.error_message || error.message
        : 'Failed to reject transaction. Please try again.';

      await Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        customClass: {
          container: 'z-[1400]'
        }
      });
    }
  };

  const handleNextStep = async () => {
    if (!user) return;

    try {
      const result = await Swal.fire({
        title: 'Proceed to the next process',
        text: `Are you sure you want to Proceed to the next process transaction ${transaction.dots_number}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, next transaction!',
        cancelButtonText: 'Cancel',
        customClass: {
          container: 'z-[1400]' 
        }
      });
  
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Processing',
          text: 'Processing transaction...',
          icon: 'info',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            container: 'z-[1400]'
          }
        });
  
        const response = await axiosJWT.post(
          `${EndpointBE}/dots/approval/${user.email}/${transaction.dots_number}`,
          { roles: role, remark: null, cost_center_approval: listApproval }
        );
  
        if (response.status !== 200) {
          throw new Error("Failed to update transaction");
        }

        if (response.status === 200) {
          await Swal.fire({
            title: 'Berhasil!',
            text: 'Transaction successfully proceed to the next process.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            window.location.reload(); 
          });
        }else{
          await Swal.fire({
            title: 'Error!',
            text: 'Failed to go to next transaction.',
            icon: 'error',
            customClass: {
              container: 'z-[1400]'
            }
          });
        }
      }
    } catch (error: unknown) {
      console.error("Error to next transaction:", error);
      
      const isApiError = (error: unknown): error is ApiErrorResponse => {
        return (
          typeof error === 'object' &&
          error !== null &&
          ('response' in error || 'message' in error)
        );
      };

      const errorMessage = isApiError(error)
        ? error.response?.data?.error_message || error.message
        : 'Failed to next transaction. Please try again.';

      await Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        customClass: {
          container: 'z-[1400]'
        }
      });
    }
  };

  const handleRevise = async () => {
    if (!user || !transaction || !revisionNotes.trim()) {
      await Swal.fire({
        title: 'Error!',
        text: 'Please provide revision notes.',
        icon: 'warning',
        customClass: {
          container: 'z-[1400]'
        }
      });
      return;
    }

    let roleTypes: string[];
    if (["1020", "2020"].includes(transaction.status)) {
      roleTypes = ["VD001", "VG001"];
    } else if (["1021", "2021"].includes(transaction.status)) {
      roleTypes = ["VG001"];
    } else if (["1030", "2030"].includes(transaction.status)) {
      roleTypes = ["VA001"];
    } else if (["1040", "2040"].includes(transaction.status)) {
      roleTypes = ["VA001"];
    } else {
      console.error("Invalid status for approval");
      return;
    }
    
    const roleObject = role?.find(
      (r) => roleTypes.includes(r.user_type)
    );
    if (!roleObject) {
      console.error("Required role not found");
      return;
    }
  
    try {
      const result = await Swal.fire({
        title: 'Revise Transaction',
        text: `Are you sure you want to revise transaction ${transaction.dots_number}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, revise it!',
        cancelButtonText: 'Cancel',
        customClass: {
          container: 'z-[1400]'
        }
      });
  
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Processing',
          text: 'Revising transaction...',
          icon: 'info',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            container: 'z-[1400]'
          }
        });        

        const response = await axiosJWT.post(
          `${EndpointBE}/dots/revise/${user.email}/${transaction.dots_number}`,
          {roles: role, remark: revisionNotes}
        );
  
        if (response.status !== 200) {
          throw new Error("Failed to revise transaction");
        }

        if (response.status === 200) {
          await Swal.fire({
            title: 'Revised!',
            text: 'Transaction has been sent for revision.',
            icon: 'success',
            customClass: {
              container: 'z-[1400]'
            }
          }).then(() => {
            setRevisionNotes('');
            window.location.reload(); 
          });
          
        }else{
          await Swal.fire({
            title: 'Error!',
            text: 'Failed to revise transaction. Please try again.',
            icon: 'error',
            customClass: {
              container: 'z-[1400]'
            }
          });
        }

      }
    } catch (error: unknown) {
      console.error("Error rejecting transaction:", error);
      
      const isApiError = (error: unknown): error is ApiErrorResponse => {
        return (
          typeof error === 'object' &&
          error !== null &&
          ('response' in error || 'message' in error)
        );
      };

      const errorMessage = isApiError(error)
        ? error.response?.data?.error_message || error.message
        : 'Failed to reject transaction. Please try again.';

      await Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        customClass: {
          container: 'z-[1400]'
        }
      });
    }
  };

  const handleReject = async () => {
    if (!user || !transaction || !revisionNotes.trim()) {
      await Swal.fire({
        title: 'Error!',
        text: 'Please provide rejection notes.',
        icon: 'warning',
        customClass: {
          container: 'z-[1400]'
        }
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Reject Transaction',
        text: `Are you sure you want to reject transaction ${transaction.dots_number}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, reject it!',
        cancelButtonText: 'Cancel',
        customClass: {
          container: 'z-[1400]'
        }
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: 'Processing',
          text: 'Rejecting transaction...',
          icon: 'info',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            container: 'z-[1400]'
          }
        });

        const deleteData = {
          role: role,
          dots_number: transaction.dots_number,
          remark: revisionNotes,
          email: user.email
        };

        const response = await axiosJWT.delete(
          `${EndpointBE}/transaction-non-insurance`, 
          { data: deleteData }
        );

        if (response.status !== 200) {
          throw new Error(response.data?.error_message || "Failed to reject transaction");
        }

        await Swal.fire({
          title: 'Rejected!',
          text: 'Transaction has been rejected.',
          icon: 'success',
          customClass: {
            container: 'z-[1400]'
          }
        }).then(() => {
          setRevisionNotes('');
          window.location.reload(); 
        });

      }
    } catch (error: unknown) {
      console.error("Error rejecting transaction:", error);
      
      const isApiError = (error: unknown): error is ApiErrorResponse => {
        return (
          typeof error === 'object' &&
          error !== null &&
          ('response' in error || 'message' in error)
        );
      };

      const errorMessage = isApiError(error)
        ? error.response?.data?.error_message || error.message
        : 'Failed to reject transaction. Please try again.';

      await Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        customClass: {
          container: 'z-[1400]'
        }
      });
    }
  };



  // Helper functions to check conditions
  const shouldShowNaikButton = (transaction: TransactionNonInsurance) => {
    const { status, trx_type, form_type } = transaction;
    
    const conditions = [
      // Condition group 1: status 1010-1060 with trx_type 1 or 2
      { status: '1010', trx_type: '1', form_type: 'Cash in Advance' },
      { status: '1020', trx_type: '1', form_type: 'Cash in Advance' },
      { status: '1021', trx_type: '1', form_type: 'Cash in Advance' },
      { status: '1030', trx_type: '1', form_type: 'Cash in Advance' },
      { status: '1040', trx_type: '1', form_type: 'Cash in Advance' },
      { status: '1050', trx_type: '1', form_type: 'Cash in Advance' },
      { status: '1060', trx_type: '2', form_type: 'Cash in Advance' },
      // Condition group 2: status 2010-2050 with trx_type 2
      { status: '2010', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] },
      { status: '2020', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] },
      { status: '2021', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] },
      { status: '2030', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] },
      { status: '2040', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] },
      { status: '2050', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] }
    ];

    return conditions.some(condition => {
      if (condition.form_types) {
        return condition.status === status && 
              condition.trx_type === trx_type && 
              condition.form_types.includes(form_type);
      }
      return condition.status === status && 
            condition.trx_type === trx_type && 
            condition.form_type === form_type;
    });
  };

  const shouldShowTurunButton = (transaction: TransactionNonInsurance) => {
    const { status, trx_type, form_type } = transaction;
    
    const conditions = [
      // Condition group 1: status 1020-1050 with trx_type 1
      { status: '1020', trx_type: '1', form_type: 'Cash in Advance' },
      { status: '1021', trx_type: '1', form_type: 'Cash in Advance' },
      { status: '1030', trx_type: '1', form_type: 'Cash in Advance' },
      { status: '1040', trx_type: '1', form_type: 'Cash in Advance' },
      { status: '1050', trx_type: '1', form_type: 'Cash in Advance' },
      // Condition group 2: status 2010-2060 with trx_type 2
      { status: '2010', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] },
      { status: '2020', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] },
      { status: '2021', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] },
      { status: '2030', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] },
      { status: '2040', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] },
      { status: '2050', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] },
      { status: '2060', trx_type: '2', form_types: ['Cash in Advance', 'Disbursement'] }
    ];

    return conditions.some(condition => {
      if (condition.form_types) {
        return condition.status === status && 
              condition.trx_type === trx_type && 
              condition.form_types.includes(form_type);
      }
      return condition.status === status && 
            condition.trx_type === trx_type && 
            condition.form_type === form_type;
    });
  };

  const handleRequestApproval = async () => {
    try {
      const insuranceGroups = materialGroup?.filter(item => 
        item.toUpperCase().startsWith('IN')
      ) || [];
      
      // Check for insurance groups and policy number
      if (
        insuranceGroups.length > 0 && 
        (!transaction.pol_number || transaction.pol_number.trim() === '')
      ) {
        const groupsList = insuranceGroups.join(', ');
    
        const result = await Swal.fire({
          title: 'Warning!',
          text: `For material group "${groupsList}", Policy Number is mandatory as it is included in cost center acquisition. Please Update and fill in the Policy Number first.`,
          icon: 'warning',
          showCancelButton: false,
          confirmButtonText: 'Update',
          customClass: {
            container: 'z-[1400]'
          }
        });
    
        if (result.isConfirmed) {
          router.push(`/detail/update/${transaction?.dots_no_hash}#policyNumber`);
        }
        return;
      }
  
      if (
        transaction.status === '2010' && 
        transaction.trx_type === '2' && 
        transaction.form_type === 'Cash in Advance'
      ) {
        const unrealizedMaterials = materialData.filter(
          item => item.realization_amt === null || item.realization_amt === undefined || item.realization_amt === 0
        );
        
        if (unrealizedMaterials.length > 0) {
          const materialList = unrealizedMaterials
            .map(item => item.material_item_desc_en)
            .join('\n- ');
  
          await Swal.fire({
            title: 'Warning!',
            html: `Please fill in the realization amount for the following materials first:<br/><br/><div style="text-align: left; padding-left: 20px">- ${materialList}</div>`,
            icon: 'warning',
            confirmButtonText: 'OK',
            customClass: {
              container: 'z-[1400]'
            }
          });
          return;
        }
      }
  
      // Proceed with submission confirmation
      const result = await Swal.fire({
        title: 'Submit Transaction',
        text: `Are you sure you want to submit transaction ${transaction.dots_number}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, submit it!',
        cancelButtonText: 'Cancel',
        customClass: {
          container: 'z-[1400]'
        }
      });
  
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Processing',
          text: 'Submitting transaction...',
          icon: 'info',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            container: 'z-[1400]'
          }
        });
  
        const response = await axiosJWT.post(
          `${EndpointBE}/dots/approval/${user.email}/${transaction.dots_number}`,
          { roles: role, remark: null, cost_center_approval: listApproval }
        );
  
        if (response.status !== 200) {
          throw new Error("Failed to update transaction");
        }
  
        await Swal.fire({
          title: 'Submitted!',
          text: 'Transaction has been submitted successfully.',
          icon: 'success',
          customClass: {
            container: 'z-[1400]'
          }
        }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to approve transaction. Please try again.',
        icon: 'error',
        customClass: {
          container: 'z-[1400]'
        }
      });
    }
  };

  const TransactionLogModal = () => {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 text-sm md:text-base md:w-auto">
              <FileText className="h-3 w-3 md:h-4 md:w-4" /> See Transaction Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Transaction Log for {transaction?.dots_number}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className='bg-gray-200'>
                  <TableRow>
                    <TableHead className='text-center text-black'>Modified By</TableHead>
                    <TableHead className='text-center text-black'>Status</TableHead>
                    <TableHead className='text-center text-black'>Modified Date</TableHead>
                    <TableHead className='text-center text-black'>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionLogs.map((log) => (
                    <TableRow key={log.seq_number}>
                      <TableCell>{log.modified_by}</TableCell>
                      <TableCell>{log.status_desc}</TableCell>
                      <TableCell>{formatDate(log.modified_date)}</TableCell>
                      <TableCell>{log.remark || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {transactionLogs.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No transaction logs found
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
    );
  };

  const ApprovalListModal = () => {
    const renderApprovalSection = (approvalData: Approval[], level:number) => {
        if (!approvalData || approvalData.length === 0) return null;

        return (
            <div className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Level {level} Approval
                </h3>
                <div className="space-y-3">
                    {approvalData.map((approval:Approval, index: number) => (
                        approval.bp === null ? (
                            <div key={index} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                                <div className="flex items-center gap-2 text-yellow-700">
                                    <AlertTriangle className="h-5 w-5" />
                                    <p className="text-sm">
                                        Approval {approval.cost_center_name} ({approval.cost_center}) not found, 
                                        please contact the Master Data Management Department
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div
                                key={index}
                                className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <UserCircle className="h-5 w-5 text-blue-600" />
                                            <h4 className="font-bold text-sm md:text-lg md:font-medium text-gray-900">
                                                {approval.name}
                                            </h4>
                                            <span className="md:text-left text-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                {approval.title}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                {approval.email}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                Cost Center: {approval.cost_center}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 text-sm md:text-base md:w-auto">
                    <Users className="h-3 w-3 md:h-4 md:w-4" /> See Approval List
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Approval List for {transaction?.dots_number}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[500px] overflow-auto md:p-4 p-1">
                    {Object.entries(listDotsApproval).map(([key, approvalData]) => {
                        const level = parseInt(key.replace('approval', ''));
                        return renderApprovalSection(approvalData, level);
                    })}
                    
                    {Object.keys(listDotsApproval).length === 0 && (
                        <div className="text-center py-8">
                            <UserX className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500">No approvers found for this transaction</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <h1 className="text-2xl font-bold mb-6 md:pl-0 pl-5">
          DOTS Transaction - {transaction?.dots_number}
        </h1>
        <div className="w-full bg-white rounded-lg shadow-md border">
          <TransactionProgress 
            formType={transaction.form_type}
            currentStatus={transaction.status}
            dotsNumber={transaction.dots_number}
            trx_type={transaction.trx_type}
          />
          <div className='w-full flex flex-col md:flex-row justify-between gap-2 pb-5 px-5'>
            <ApprovalListModal />
            <TransactionLogModal />
          </div>
        </div>

        {/* Transaction Details */}
        <Card className="shadow-lg md:m-0 m-0">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              Transaction Detail
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Form Type</p>
                <p className="font-medium">{transaction?.form_type || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal Mulai</p>
                <p className="font-medium">{formatDate(transaction?.start_date) ||'-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Memo Number</p>
                <p className="font-medium">{transaction?.memo || '-'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{transaction?.category ||'-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal Selesai</p>
                <p className="font-medium">{formatDate(transaction?.end_date)||'-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{transaction?.status_desc ||'-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Information */}
        <Card className="shadow-lg md:m-0 m-0">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Business Partner ID</p>
                <p className="font-medium">{transaction?.bpid ||'-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employee NIP</p>
                <p className="font-medium">{transaction?.employee_nip ||'-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cost Center</p>
                <p className="font-medium">{transaction?.cost_center_bp ||'-'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Employee Name</p>
                <p className="font-medium">{transaction?.employee_name ||'-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employee Email</p>
                <p className="font-medium">{transaction?.employee_email ||'-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Division</p>
                <p className="font-medium">{transaction?.division || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Information */}
        {transaction.category === 'Vendor' && (
          <Card className="shadow-lg md:m-0 m-0">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Vendor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Client Id</p>
                  <p className="font-medium">{transaction?.client_bpid ||'-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Clint Name</p>
                  <p className="font-medium">{transaction?.client_name ||'-'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Vendor Address</p>
                  <p className="font-medium">{transaction?.address ||'-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {transaction.category === 'Vendor' ? (
            <>
              {/* Additional Information Section */}
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-500" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Event Name</p>
                      <p className="font-medium">{transaction?.event || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Purpose</p>
                      <p className="font-medium whitespace-pre-wrap">
                        {transaction?.purpose || '-'}
                      </p>    
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Policy Number</p>
                    <p className="font-medium">{transaction?.pol_number || '-'}</p>
                  </div>
                  </div>
                  </CardContent>
              </Card>
            </>
          ):(
            <>
              {/* Additional Information */}
              <Card className="shadow-lg md:m-0 m-0">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-500" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Event Name</p>
                      <p className="font-medium">{transaction?.event || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Client Name</p>
                      <p className="font-medium">{transaction?.client_name || '-'}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Address</p>
                      <p className="font-medium whitespace-pre-wrap">
                        {transaction?.address || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Purpose</p>
                      <p className="font-medium whitespace-pre-wrap">
                        {transaction?.purpose || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Policy Number</p>
                      <p className="font-medium">{transaction?.pol_number || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}



        {/* Payment Information */}
        <Card className="shadow-lg md:m-0 m-0">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6 justify-center"> 
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Currency</p>
                <p className="font-medium">{transaction?.curr_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Type</p>
                <p className="font-medium">{transaction?.payment_type||'-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">
                  {transaction?.estimate_payment_due_date
                    ? formatDate(transaction?.estimate_payment_due_date)
                    : '-'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Payment Details</p>
              <p className="font-medium whitespace-pre-wrap">
                {transaction?.remark_payment || '-'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Bank Account</p>
                <p className="font-medium">{transaction?.employee_acct_bank_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bank Name</p>
                <p className="font-medium">{transaction?.employee_bank_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Name</p>
                <p className="font-medium">{transaction?.employee_acct_bank_name || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SAP Information */}
        {transaction && (transaction.status === '1050' || transaction.status === '2050' || transaction.status === '1060' || transaction.status === '2060') && (
          <Card className="shadow-lg md:m-0 m-0">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Image
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}/images/sap.png`}
                  alt="Tugu Insurance"
                  width={80}
                  height={40}
                  className="opacity-80 hover:opacity-100 transition-opacity duration-200"
                  priority
                  unoptimized      
                />
                SAP Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 justify-center"> 
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">SAP DP Request No</p>
                  <p className="font-medium">{transaction?.sap_dp_request_no || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SAP PO Document No</p>
                  <p className="font-medium">{transaction?.sap_po_doc_no||'-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SAP Acc Doc No</p>
                  <p className="font-medium">{transaction?.sap_acc_doc_no||'-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SAP Invoice No</p>
                  <p className="font-medium">{transaction?.sap_invoice_number||'-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Material Items Table */}
        <MaterialItemsTable setMaterialGroup={setMaterialGroup} emailDots={transaction.created_by} emailInputter={user.email} dotsNumber={transaction?.dots_number} status={transaction.status} transaction_type={transaction.trx_type} form_type={transaction.form_type} setMaterialData={setMaterialData} currencyType={transaction.curr_id}/>

        {/* Dots Items Table */}
        <GlItemsTable dotsNumber={transaction?.dots_number} status={transaction.status} transaction_type={transaction.trx_type} form_type={transaction.form_type} currency_type={transaction.curr_id}/>

        {(transaction.status === '1010' || (transaction.status === '2010' && transaction.trx_type === '2' && transaction.form_type === 'Disbursement')) && (
          <div className='flex justify-end p-4'>
            <Button 
              type="button" 
              className="bg-blue-500 hover:bg-blue-600 text-white" 
              onClick={() => router.push(`/create/material/${transaction?.dots_no_hash}`)}
            >
              Create Material
            </Button>
          </div>
        )}

        {/* Transaction Summary Card */}
        <Card className="shadow-lg md:m-0 m-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              Transaction Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6 justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Total Proposed</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(transaction?.total_proposed_amt) || '0.00'}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Total Realization</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(transaction?.total_realization_amt) || '0.00'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Total Different</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(transaction?.total_diff_amt) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details Card */}
        <Card className="shadow-lg md:m-0 m-0">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6 justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Create By</p>
                <p className="font-medium">
                  {transaction?.created_by}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Modify By</p>
                <p className="font-medium">
                  {transaction?.modified_by || '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Create Date</p>
                <p className="font-medium">
                  {formatDate(transaction?.created_date)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Modify Date</p>
                <p className="font-medium">
                  {formatDate(transaction?.modified_date)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* M-Files Section */}
        <MFilesSection setIsUploadMfiles={setIsUploadMFiles} formData={transaction} group_code={groupCode} isAdmin={isAdmin} emailInputter={user.email}/>

        {user && checkApprovalEligibility() == true && (
          <Card className="shadow-lg md:m-0 m-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <FileEdit className="h-6 w-6 text-black" />
                <CardTitle className="text-black">Revision Management</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-600">Revision Notes</Label>
                <Textarea 
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Enter your revision comments or reasons here..."
                  className="min-h-[100px] resize-y"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <Button 
                    onClick={handleRevise}
                    variant="outline" 
                    className="border-yellow-500 bg-yellow-500 text-white hover:text-white hover:bg-yellow-600 hover:border-yellow-600 transition-colors"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Revise
                  </Button>
                  {transaction.status !== '1030' && transaction.status !== '2030' && transaction.status !== '1040' && transaction.status !== '2040' && (
                    <Button 
                      onClick={handleReject}
                      variant="outline" 
                      className="border-red-500 bg-red-500 text-white hover:text-white hover:bg-red-600 hover:border-red-600 transition-colors"
                    >
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    )}   
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col-reverse md:flex-row justify-between w-full gap-8 py-4">
          {/* Back button - always visible */}
          <Button
            type="button"
            onClick={() => router.push('/show')}
            className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto transition-colors duration-200"
          >
            Back
          </Button>

          {/* Action buttons container */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <>
              {(transaction.status === '1010' || 
                (transaction.status === '2010' && transaction.trx_type === '2' && transaction.form_type === 'Disbursement')
                || (user && isCreatingDots() == true) || ((user && checkApprovalEligibility() === true) && !['2010', '1010'].includes(transaction.status))) && (
                <>
                  {((user && checkApprovalEligibility() === true) && !['2010', '1010'].includes(transaction.status)) ? (
                    <>
                    {transaction.status !== '1040' && transaction.status !== '2040' && (
                      <>
                        <Button 
                            onClick={handleApprove}
                            className="bg-green-600 hover:bg-green-700 w-full transition-colors duration-200 text-white"
                          >
                            <Check className="mr-2 h-4 w-4" /> Approve Transaction
                        </Button>
                      </>
                    )}
                    </>
                  ):(
                    <>
                      {(transaction.created_by === user.email) && (
                        <>
                          {((transaction.status === '2010' && transaction.trx_type === '2' && transaction.form_type === 'Disbursement') || (transaction.status === '1010' && transaction.trx_type === '1' && 
                                  transaction.form_type === 'Cash in Advance')) && (
                            <>
                            <Button 
                              type="button"
                              variant="destructive"
                              onClick={handleDelete}
                              className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto transition-colors duration-200"
                            >
                              Delete
                            </Button>
                             <Button 
                              type="button"
                              onClick={handleUpdate}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white w-full sm:w-auto transition-colors duration-200"
                              >
                                Update
                              </Button>
                            </>
                          )}
                          
                          {((transaction.status === '2010' && transaction.trx_type === '2' && ( 
                                transaction.form_type === 'Cash in Advance' || transaction.form_type === 'Disbursement')) || (transaction.status === '1010' && transaction.trx_type === '1' && 
                                  transaction.form_type === 'Cash in Advance')) && (  
                                  <Button 
                                    type="button"
                                    onClick={handleRequestApproval}
                                    className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto transition-colors duration-200"
                                    disabled={disableRequestApproval()}
                                  >
                                    Request Approval
                                  </Button>
                          )}
              
                          
                          {(transaction.status === '1060' && transaction.trx_type === '2' && 
                                transaction.form_type === 'Cash in Advance') && (
                            <>
                              <Button 
                                type="button"
                                onClick={handleNextStep}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white w-full sm:w-auto transition-colors duration-200"
                              >
                                Proceed to the next process
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {transaction.created_by === user.email && (
                <>
                  {/* Status 2010 & Cash in Advance buttons */}
                  {(transaction.status === '2010' && transaction.trx_type === '2' && 
                        transaction.form_type === 'Cash in Advance') && (  
                      <Button 
                        type="button"
                        onClick={handleRequestApproval}
                        disabled={disableRequestApproval()}
                        className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto transition-colors duration-200"
                      >
                        Request Approval
                      </Button>
                  )}
      
                  {/* Status 1060 & Cash in Advance button */}
                  {(transaction.status === '1060' && transaction.trx_type === '2' && 
                        transaction.form_type === 'Cash in Advance') && (
                    <>
                      <Button 
                        type="button"
                        onClick={handleNextStep}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white w-full sm:w-auto transition-colors duration-200"
                      >
                        Proceed to the next process
                      </Button>
                    </>
                  )}
                </>
              )}
            </>
          </div>
        </div>
      </div>
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        dots_number={transaction?.dots_number}
      />
    </Layout>
  );
}