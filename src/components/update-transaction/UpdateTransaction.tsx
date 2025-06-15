'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from "@/lib/auth-context";
import PaymentInformationCard from './PaymentInformationCard';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Briefcase, Users, Building, Loader2, ArrowRight } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search } from 'lucide-react';
import { TransactionNonInsurance } from '@/types/newDots';
import ConfirmationModal from '../modal/ConfirmationModalProps';
import Swal from 'sweetalert2';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import AccessDenied from '@/components/error/access-denied/page';
import MFilesSection from '../detail/MFiles';
import VendorInformationCard from './VendorUpdateCard';
import VendorPaymentInformationCard from './VendorPaymentInformationCard';
import PolicyNumberForm from './PolicyNumberInformation';

interface DecodedToken {
    exp: number;
}


type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface UpdateTransactionProps {
  dots_no_hash: string;
}

interface Currency {
  ref_id: string;
  ref_code: string;
  description: string;
}


interface BankDetail {
  Banka: string;
  Bankl: string;
  Bankn: string;
  Banks: string;
  Bkref: string;
  Bpext: string;
  Koinh: string;
  Mandt: string;
  Partner: string;
}

interface Employee {
  partner: string;
  name_first: string;
  email: string;
  nip: string;
  cost_center: string;
  division: string;
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

interface Application {
  app_id: string;
  app_name: string;
  app_url: string;
  is_active: number;
  role: Role[];
  cost_center_approval: CostCenterApproval;
}

type CostCenterApproval = {
  approval1: string;
  approval2: string;
  approval3: string;
  approval4: string;
  approval5: string;
  name: string;
  cost_center: string;
  email: string;
  bp: string;
}

interface CardData {
  card_no: string;
  bp: string;
  cardholder_name: string;
  bank_name: string;
  category: string;
  valid_from: string;
  valid_to: string | null;
}

function getRolesByApplicationName(
  applications: Application[],
  targetName: string
): Role[] | null {
  const app = applications.find((app) => app.app_name === targetName);
  return app ? app.role : null;
}

const calculateDefaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

function hasUserTypeA0001(data: Role[] | null):boolean | undefined {
  return data?.some(item => item.user_type === 'A0001');
}

const UpdateTransaction: React.FC<UpdateTransactionProps> = ({ dots_no_hash }) => {
  const router = useRouter();
  const DotsEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const BpmsEndPoint = process.env.NEXT_PUBLIC_BPMS_BE_END_POINT;
  const [startDisplayDate, setStartDisplayDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [endDisplayDate, setEndDisplayDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role[] | null>([]);
  const [isLoadingPaymentInfo, setIsLoadingPaymentInfo] = useState(false);
  const [formData, setFormData] = useState<TransactionNonInsurance>({
    BUKRS: '',
    dots_number: '',
    dots_no_hash: '',
    purch_org: '',
    purch_group: '',
    memo: '',
    memo_link: '',
    category: '',
    form_type: '',
    trx_type: '',
    bpid: '',
    employee_name: '',
    employee_nip: '',
    division: '',
    cost_center_bp: '',
    destination_scope: '',
    cost_center_verificator_1: '',
    cost_center_verificator_2: '',
    cost_center_verificator_3: '',
    cost_center_verificator_4: '',
    cost_center_verificator_5: '',
    region_group: '',
    cost_center_inputter: '',
    client_bpid: '',
    client_name: '',
    destination: '',
    event: '',
    purpose: '',
    address: '',
    start_date: '',
    end_date: '',
    invoice_number: '',
    pol_number: '',
    curr_id: '',
    total_proposed_amt: 0,
    total_realization_amt: 0,
    total_diff_amt: 0,
    payment_type: '',
    estimate_payment_due_date: '',
    employee_bank_name: '',
    employee_acct_bank_number: '',
    employee_acct_bank_name: '',
    employee_cash_card: '',
    employee_email: '',
    employee_acct_swift_code: '',
    employee_acct_iban: '',
    remark_payment: '',
    sap_dp_request_no: '',
    sap_dp_request_year: '',
    sap_po_doc_no: '',
    sap_po_doc_year: '',
    sap_acc_doc_no: '',
    sap_acc_doc_year: '',
    sap_invoice_number: '',
    sap_invoice_year: '',
    status: '',
    created_by: '',
    created_date: '',
    modified_by: '',
    modified_date: '',
  });
  const [isAcquisition, setIsAcquisition] = useState<boolean>(false);
  const [employeeData, setEmployeeData] = useState<Employee[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [currencyList, setCurrencyList] = useState<Currency[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [initialFormData, setInitialFormData] = useState<TransactionNonInsurance | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [expire, setExpire] = useState<number | null>(null);
  const [groupCode, setGroupCode] = useState<string>('');
  const [isUploadMFiles, setIsUploadMFiles] = useState<boolean|undefined>(false);
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(false);
  const SapEndPoint = process.env.NEXT_PUBLIC_SAP_END_POINT;
  const APIEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;
  const [cardData, setCardData] = useState<CardData[]>([]);

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
  
  const { user } = useAuth() as {
    user: User;
  };

  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname);

    const handleBackButton = async (e: PopStateEvent) => {
      if (isFormChanged) {
        e.preventDefault();
        
        window.history.pushState(null, '', window.location.pathname);

        setShowConfirmationModal(true);
        setNavigationTarget('back');
      }
    };

    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [isFormChanged]);

  const getFormData = (formType: string) => {
      if((formData.dots_number).startsWith('V')){
          return 'R';
      }else{
          switch (formType) {
              case 'Cash in Advance':
                  return 'C';
              case 'Disbursement':
                  return 'R';
              default:
                  return '';
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
                return '';
        }
    };

    const getCategory = (category: string) => {
        if((formData.dots_number).startsWith('V')){
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
                    return '';
            }
        }
    };

    useEffect(() => {
      const fetchTransactionData = async () => {
        try {
          setIsLoading(true);
          const response = await axiosJWT.get(
            `${DotsEndPoint}/get/transaction-non-insurance/${dots_no_hash}`,
          );
          
          if (response.status !== 200) {
            throw new Error('Failed to fetch transaction');
          }
          
          const data = response.data;
          
          const today = new Date();
          const defaultDueDate = new Date(today);
          defaultDueDate.setDate(today.getDate() + 8);
          const dataDueDate = defaultDueDate.toISOString().split('T')[0];
          
          data.estimate_payment_due_date = dataDueDate;
          
          setFormData(data);
          setInitialFormData({...data}); 
          
          if (data.cost_center_bp) {
            const empResponse = await axiosJWT.get(`${BpmsEndPoint}/employee?cost_center=${data.cost_center_bp}`);
            const empData = empResponse.data || [];
            
            if (!Array.isArray(empData)) {
              console.error("Data karyawan tidak valid:", empData);
              setEmployeeData([]);
              return;
            }
  
            if (['Cash Card', 'Corporate Card'].includes(data.category)) {
              let responseCard = null;
              if (data.category === 'Cash Card') {
                responseCard = await axiosJWT.get(`${DotsEndPoint}/cash-cards/${data.category}/${data.cost_center_bp}`);
              } else {
                responseCard = await axiosJWT.get(`${DotsEndPoint}/cash-cards/${data.category}/NULL`);
              }
              
              const cardData = responseCard?.data || [];
              setCardData(cardData);
  
              if (!Array.isArray(cardData)) {
                console.error("Data kartu tidak valid:", cardData);
                setCardData([]);
                return;
              }
  
              const validEmployees = empData.filter((emp) =>
                cardData.some((card) => card.bp === emp.partner) && 
                emp.partner.startsWith('13')
              );
  
              if (validEmployees.length === 0) {
                await Swal.fire({
                  title: 'Employee Not Found!',
                  text: `The ${data.category} data for ${data.cost_center_bp} could not be found for any employee.`,
                  icon: 'error',
                  customClass: {
                    container: 'z-[1400]'
                  }
                });
              }
  
              setEmployeeData(validEmployees);
            } else {
              const filteredEmployees = empData.filter(emp => emp.partner.startsWith('13'));
              setEmployeeData(filteredEmployees);
            }
          }
  
          const responseCostCenterApproval = await axiosJWT.get(
            `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/cost-center-approval/${data.bpid}`
          );
          const dataListApproval = responseCostCenterApproval.data.cost_center_approval;
  
          setGroupCode(dataListApproval.approval2 || dataListApproval.approval1);
  
          const targetName = "DOTS";
          const roles = getRolesByApplicationName(user?.application, targetName);
          setRole(roles);
  
          const viewAdmin = hasUserTypeA0001(roles);
          setIsAdmin(viewAdmin);
  
          const currencyResponse = await axiosJWT.get(`${DotsEndPoint}/get/currency`);
          const currencyData = currencyResponse.data;
          setCurrencyList(currencyData.data || []);
  
          // Modified bank details fetching
          if (data.bpid) {
            if (['Cash Card', 'Corporate Card'].includes(data.category)) {
              let response = null;
              if (data.category === 'Cash Card') {
                response = await axiosJWT.get(`${DotsEndPoint}/cash-cards/bp/${data.bpid}/${data.category}/${data.cost_center_bp}`);
              } else {
                response = await axiosJWT.get(`${DotsEndPoint}/cash-cards/bp/${data.bpid}/${data.category}/null`);
              }
              
              const cardData = response?.data;
              setCardData(cardData);

              if (cardData && cardData.length > 0) {
                const firstCard = cardData[0];
                
                // Mengkonversi CardData ke format BankDetail
                const bankDetail: BankDetail = {
                  Partner: firstCard.bp,
                  Banks: "ID",
                  Banka: firstCard.bank_name,
                  Bkref: "IDR",
                  Koinh: firstCard.cardholder_name,
                  Bankn: firstCard.card_no,
                  Bankl: "",
                  Bpext: "",
                  Mandt: "",
                };
                setBankDetails([bankDetail]);
              } else {
                console.warn('Bank details not found or invalid format');
                setBankDetails([]);
              }
            } else {
              const endpoint = `${SapEndPoint}/BussinesPartner/BankInfo`;
              const partnerParam = data.dots_number.startsWith('E') 
                ? data.bpid 
                : data.client_bpid;
          
              const response = await axios.get(endpoint, {
                params: { PARTNER: partnerParam },
              });
          
              const bankData = response.data;
          
              if (bankData?.data_result) {
                setBankDetails(bankData.data_result);
              } else {
                console.warn('Bank details not found or invalid format');
                setBankDetails([]);
              }
            }
          }
  
          const getCostCenterAcquisition = await axiosJWT(`${DotsEndPoint}/is-cost-center-acquisition/${dots_no_hash}`);
          if(getCostCenterAcquisition.status === 200){
            const getValidation = getCostCenterAcquisition.data.is_acquisition;
            setIsAcquisition(getValidation);
          }
  
        } catch (err) {
          setError('Failed to fetch transaction data');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
  
      if(!isTokenLoading && user ){
        fetchTransactionData();
      }
  
    }, [dots_no_hash, token, axiosJWT, isTokenLoading, user]);
  
    const handleEmployeeSelect = async (employee: Employee) => {
      setIsLoadingPaymentInfo(true);
      try {
        setFormData({
          ...formData,
          bpid: employee.partner,
          employee_name: employee.name_first.trim(),
          employee_nip: employee.nip.trim(),
          cost_center_bp: employee.cost_center,
          division: employee.division.trim(),
          employee_email: employee.email.trim()
        });
    
        if (employee.partner) {
          if (formData.dots_number.startsWith('V')) return;
          
          if (['Cash Card', 'Corporate Card'].includes(formData.category)) {
            let response = null;
            if (formData.category === 'Cash Card') {
              response = await axiosJWT.get(`${DotsEndPoint}/cash-cards/bp/${employee.partner}/${formData.category}/${formData.cost_center_bp}`);
            } else {
              response = await axiosJWT.get(`${DotsEndPoint}/cash-cards/bp/${employee.partner}/${formData.category}/null`);
            }
            
            const cardData = response?.data;
            setCardData(cardData);
            
            if (cardData && cardData.length > 0) {
              const firstCard = cardData[0];
              setFormData(prev => ({
                ...prev,
                currency: 'IDR',
                payment_remark: '',
                payment_type: 'Block for payment',
                estimate_payment_due_date: calculateDefaultDueDate(),
                employee_acct_bank_number: firstCard.card_no,
                employee_bank_name: firstCard.bank_name,
                employee_acct_bank_name: firstCard.cardholder_name
              }));
            }
          } else {
            const bankResponse = await axios.get(`${SapEndPoint}/BussinesPartner/BankInfo?PARTNER=${employee.partner}`);
            const bankData = bankResponse.data;
            setBankDetails(bankData.data_result || []);
            
            setFormData(prev => ({
              ...prev,
              employee_acct_bank_number: '',
              employee_bank_name: '',
              employee_acct_bank_name: ''
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching bank details:', error);
      } finally {
        setIsLoadingPaymentInfo(false);
        setIsPopoverOpen(false);
      }
    };

    const formatDisplayDate = (dateString: string) => {
        if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
        });
    };

    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getYesterdayDate = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

  useEffect(() => {
    setStartDisplayDate(formatDisplayDate(formData.start_date || ''));
    setEndDisplayDate(formatDisplayDate(formData.end_date || ''));
  }, [formData.start_date, formData.end_date]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date(getCurrentDate());
    today.setHours(0, 0, 0, 0);
  
    const endDate = formData.end_date ? new Date(formData.end_date) : null;
    
    if (endDate && selectedDate > endDate) {
      alert("Start date cannot be later than end date");
      setFormData?.({ 
        ...formData, 
        start_date: '', 
        end_date: '' 
      });
      return;
    }
  
    if (formData.form_type === 'Cash in Advance') {
      if (selectedDate >= today) {
        setFormData?.({ ...formData, start_date: e.target.value });
      } else {
        alert("For Cash in Advance, please select today or a future date");
        setFormData?.({ 
          ...formData, 
          start_date: getCurrentDate(),
          end_date: '' 
        });
      }
    } else if (formData.form_type === 'Disbursement') {
      if (selectedDate < today) {
        setFormData?.({ ...formData, start_date: e.target.value });
      } else {
        alert("For Disbursement, please select a date before today");
        setFormData?.({ 
          ...formData, 
          start_date: getYesterdayDate(),
          end_date: '' 
        });
      }
    } else {
      setFormData?.({ ...formData, start_date: e.target.value });
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date(getCurrentDate());
    today.setHours(0, 0, 0, 0);
  
    const startDate = formData.start_date ? new Date(formData.start_date) : null;
    
    if (startDate && selectedDate < startDate) {
      alert("End date cannot be earlier than start date");
      setFormData?.({ 
        ...formData, 
        start_date: '', 
        end_date: '' 
      });
      return;
    }
  
    if (formData.form_type === 'Cash in Advance') {
      if (selectedDate >= today) {
        setFormData?.({ ...formData, end_date: e.target.value });
      } else {
        alert("For Cash in Advance, please select today or a future date");
        setFormData?.({ 
          ...formData, 
          start_date: '',
          end_date: '' 
        });
      }
    } else if (formData.form_type === 'Disbursement') {
      if (selectedDate < today) {
        setFormData?.({ ...formData, end_date: e.target.value });
      } else {
        alert("For Disbursement, please select a date before today");
        setFormData?.({ 
          ...formData, 
          start_date: '',
          end_date: '' 
        });
      }
    } else {
      setFormData?.({ ...formData, end_date: e.target.value });
    }
  };

  const checkRequiredFields = (formData: TransactionNonInsurance): boolean => {
    const requiredFields: {[key: string]: string} = {
      start_date: 'Start Date',
      end_date: 'End Date',
      bpid: 'Business Partner',
      employee_name: 'Employee Name',
      employee_nip: 'Employee NIP',
      employee_email: 'Employee Email',
      cost_center_bp: 'Cost Center',
      division: 'Division',
      curr_id: 'Currency',
      payment_type: 'Payment Type',
      event: 'Event Name',
      purpose: 'Purpose',
    };

    if (!formData.dots_number.startsWith('E')) {
      requiredFields.invoice_number = 'Invoice Number';
    }
  
    if (formData.payment_type === 'Cash') {
      requiredFields.remark_payment = 'Payment Details';
    }else if(formData.payment_type === 'Transfer'){
      requiredFields.employee_acct_bank_number = "Employee Account Bank Number",
      requiredFields.employee_bank_name = "Employee Bank Name",
      requiredFields.employee_acct_bank_name = "Employee Account Bank Name"
    }

    if(isAcquisition === true) {
      requiredFields.pol_number = 'Poicy Number'
    }
  
    const emptyFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key as keyof TransactionNonInsurance])
      .map(([_, label]) => label);
  
    if (emptyFields.length > 0) {
      Swal.fire({
        title: 'Required Fields Empty',
        html: `Please fill in the following required fields:<br><br>${emptyFields.join('<br>')}`,
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
      return false;
    }
  
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoadingUpdate) {
      return;
    }
  
    if (!checkRequiredFields(formData)) {
      return;
    }
  
    const confirmResult = await Swal.fire({
      title: 'Confirm Update',
      text: 'Are you sure you want to update this transaction?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel'
    });
  
    if (confirmResult.isConfirmed) {
      try {
        setIsLoadingUpdate(true);
        
        const updatedFormData = {
          ...formData,
          category: getCategory(formData.category),
          form_type: getFormData(formData.form_type),
          payment_type: getPaymentType(formData.payment_type),
          modified_by: user?.email
        };
  
        const response = await axiosJWT.patch(
          `${DotsEndPoint}/transaction-non-insurance/${formData.BUKRS}/${formData.dots_number}`,
          updatedFormData
        );
  
        if (response.status === 200) {
          let shouldNavigate = true;
          
          const successResult = await Swal.fire({
            title: 'Success!',
            text: 'Transaction has been updated successfully',
            icon: 'success',
            confirmButtonColor: '#3085d6'
          });
  
          if (shouldNavigate && successResult.isConfirmed) {
            setTimeout(() => {
              router.push(`/detail/${dots_no_hash}`);
            }, 100);
          }
  
          return () => {
            shouldNavigate = false;
          };
        }
      } catch (err) {
        await Swal.fire({
          title: 'Error!',
          text: 'Failed to update transaction',
          icon: 'error',
          confirmButtonColor: '#3085d6'
        });
        console.error(err);
      } finally {
        setIsLoadingUpdate(false);
      }
    }
  };

  const isDeepEqual = (
    obj1: DeepPartial<TransactionNonInsurance> | null, 
    obj2: DeepPartial<TransactionNonInsurance>
  ): boolean => {
      if (obj1 === obj2) return true;
      
      if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
          return false;
      }
      
      const keys1 = Object.keys(obj1) as Array<keyof typeof obj1>;
      const keys2 = Object.keys(obj2) as Array<keyof typeof obj2>;
      
      if (keys1.length !== keys2.length) return false;
      
      for (const key of keys1) {
          if (!keys2.includes(key)) return false;
          
          const val1 = obj1[key];
          const val2 = obj2[key];
          
          if (typeof val1 === 'object' && typeof val2 === 'object') {
              if (!isDeepEqual(
                  val1 as DeepPartial<TransactionNonInsurance> | null, 
                  val2 as DeepPartial<TransactionNonInsurance>
              )) return false;
          } else if (val1 !== val2) {
              return false;
          }
      }
      
      return true;
  };

  useEffect(() => {
    if (initialFormData) {
      const hasChanged = !isDeepEqual(initialFormData, formData);
      setIsFormChanged(hasChanged);
    }
  }, [formData, initialFormData]);

  useEffect(() => {
    if(isLoading) return
    if(isAcquisition && (formData.pol_number === null || formData.pol_number === '')){
      const targetElement = document.getElementById('policyNumber');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }else{
      return
    }
  }, [isLoading]);

  const handleCancel = () => {
    if (isFormChanged) {
      setNavigationTarget(`/detail/${formData.dots_no_hash}`);
      setShowConfirmationModal(true);
    } else {
      router.back();
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormChanged) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormChanged]);

  const handleConfirmNavigation = () => {
    setShowConfirmationModal(false);
    if (navigationTarget == 'back') {
      router.push(`/detail/${formData.dots_no_hash}`);
    } else if (navigationTarget) {
      router.push(navigationTarget);
    }
    
    setNavigationTarget(null);
  };

  const handleCancelNavigation = () => {
    setShowConfirmationModal(false);
    setNavigationTarget(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading Transaction...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if(!isLoading){
    if(!(formData.status === '1010' || 
      (formData.status === '2010' && formData.trx_type === '2' && formData.form_type === 'Disbursement') || (formData.status === '1060' && formData.trx_type === '2' && 
        formData.form_type === 'Cash in Advance') || (formData.status === '2010' && formData.trx_type === '2' && 
          formData.form_type === 'Cash in Advance'))){
      
      return(
        <AccessDenied/>
      )
  
    }
  }

  return (
    <Layout>
      <div className="container mx-auto py-4 space-y-6">
        <h1 className="text-2xl font-bold mb-6">Update Transaction - {formData.dots_number}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {formData.dots_number.startsWith('E')?(
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                    Transaction Detail
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date{" "}
                        <span className="text-red-500 relative group">
                            *
                            <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                            Required
                            </div>
                        </span>
                    </label>
                    <div className="relative">
                        <input
                          type="text"
                          className="w-full border rounded-md px-3 py-1.5 cursor-pointer bg-white"
                          value={startDisplayDate}
                          placeholder="Select start date"
                          onClick={() => setShowStartDatePicker(prev => !prev)}
                          readOnly
                          required
                        />
                        {showStartDatePicker && (
                        <div className="absolute z-50 w-full">
                            <div className="bg-white border shadow-lg rounded-md p-2">
                            <input
                                type="date"
                                className="w-full"
                                value={formData.start_date || ''}
                                min={formData.form_type === 'Cash in Advance' ? getCurrentDate() : undefined}
                                max={formData.form_type === 'Disbursement' ? getYesterdayDate() : undefined}
                                onChange={(e) => {
                                  handleStartDateChange(e);
                                }}
                                onBlur={() => setShowStartDatePicker(false)}
                            />
                            </div>
                        </div>
                        )}
                    </div>
                </div>

                {/* End Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date{" "}
                        <span className="text-red-500 relative group">
                            *
                            <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                            Required
                            </div>
                        </span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full border rounded-md px-3 py-1.5 cursor-pointer bg-white"
                            value={endDisplayDate}
                            placeholder="Select end date"
                            onClick={() => setShowEndDatePicker(prev => !prev)}
                            readOnly
                            required
                        />
                        {showEndDatePicker && (
                        <div className="absolute z-50 w-full">
                            <div className="bg-white border shadow-lg rounded-md p-2">
                            <input
                                type="date"
                                className="w-full"
                                value={formData.end_date || ''}
                                min={formData.form_type === 'Cash in Advance' ? getCurrentDate() : undefined}
                                max={formData.form_type === 'Disbursement' ? getYesterdayDate() : undefined}
                                onChange={(e) => {
                                handleEndDateChange(e);
                                setShowEndDatePicker(false);
                                }}
                                onBlur={() => setShowEndDatePicker(false)}
                            />
                            </div>
                        </div>
                        )}
                    </div>
                    </div>
                    {/* Memo Number */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Memo Number</label>
                        <Input
                          value={formData.memo || ''}
                          onChange={e => setFormData({ ...formData, memo: e.target.value })}
                        />
                    </div>
                    {/* Memo Link */}
                    <div className="flex space-x-2">
                      <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Memo Link</label>
                      <Input 
                          placeholder="Enter memo link"
                          value={formData.memo_link || ''}
                          onChange={(e) => setFormData({ ...formData, memo_link: e.target.value })}
                      />
                      </div>
                      <Button variant="outline" className="mt-6">
                      <ArrowRight className="w-4 h-4" />
                      </Button>
                  </div>

                </CardContent>
              </Card>
            </>
          ):(
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                    Transaction Detail
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className='grid md:grid-cols-1' >
                  {/* Invoice Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number{" "}
                        <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                            Required
                        </div>
                        </span>
                    </label>
                    <Input placeholder="Enter invoice number" className="w-full" onChange={(e) => setFormData((prev)=>({ ...prev, invoice_number: e.target.value }))} value={formData.invoice_number?formData.invoice_number:''} required/>
                  </div>
                </div>

                <div className='grid md:grid-cols-2 gap-6 mt-6'>
                  <div>
                      <label className="block text-sm font-medium mb-1">Memo Number</label>
                      <Input
                        value={formData.memo || ''}
                        onChange={e => setFormData({ ...formData, memo: e.target.value })}
                      />
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Memo Link</label>
                        <div className="flex space-x-2">
                        <Input placeholder="Enter memo link" className="w-full" value={formData.memo_link?formData.memo_link:''} onChange={(e) => setFormData((prev)=>({ ...prev, memo_link: e.target.value }))}/>
                        <Button variant="outline" className="flex-shrink-0">
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                        </div>
                    </div>
                </div>


                <div className='grid md:grid-cols-2 gap-6 mt-6'>
                {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date{" "}
                        <span className="text-red-500 relative group">
                            *
                            <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                            Required
                            </div>
                        </span>
                    </label>
                    <div className="relative">
                        <input
                          type="text"
                          className="w-full border rounded-md px-3 py-1.5 cursor-pointer bg-white"
                          value={startDisplayDate}
                          placeholder="Select start date"
                          onClick={() => setShowStartDatePicker(prev => !prev)}
                          readOnly
                          required
                        />
                        {showStartDatePicker && (
                        <div className="absolute z-50 w-full">
                            <div className="bg-white border shadow-lg rounded-md p-2">
                            <input
                                type="date"
                                className="w-full"
                                value={formData.start_date || ''}
                                min={formData.form_type === 'Cash in Advance' ? getCurrentDate() : undefined}
                                max={formData.form_type === 'Disbursement' ? getYesterdayDate() : undefined}
                                onChange={(e) => {
                                  handleStartDateChange(e);
                                }}
                                onBlur={() => setShowStartDatePicker(false)}
                            />
                            </div>
                        </div>
                        )}
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date{" "}
                          <span className="text-red-500 relative group">
                              *
                              <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                              Required
                              </div>
                          </span>
                      </label>
                      <div className="relative">
                          <input
                              type="text"
                              className="w-full border rounded-md px-3 py-1.5 cursor-pointer bg-white"
                              value={endDisplayDate}
                              placeholder="Select end date"
                              onClick={() => setShowEndDatePicker(prev => !prev)}
                              readOnly
                              required
                          />
                          {showEndDatePicker && (
                          <div className="absolute z-50 w-full">
                              <div className="bg-white border shadow-lg rounded-md p-2">
                              <input
                                  type="date"
                                  className="w-full"
                                  value={formData.end_date || ''}
                                  min={formData.form_type === 'Cash in Advance' ? getCurrentDate() : undefined}
                                  max={formData.form_type === 'Disbursement' ? getYesterdayDate() : undefined}
                                  onChange={(e) => {
                                  handleEndDateChange(e);
                                  setShowEndDatePicker(false);
                                  }}
                                  onBlur={() => setShowEndDatePicker(false)}
                              />
                              </div>
                          </div>
                          )}
                      </div>
                </div>
                </div>
              
                </CardContent>
              </Card>
            </>
          )}

          {/* Employee Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Business Partner{" "}
                  <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                      Required
                    </div>
                  </span>
                </label>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {formData.bpid 
                        ? `${formData.bpid} - ${formData.employee_name}`
                        : "Select business partner..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="p-0" 
                    align="start"
                    side="bottom"
                    style={{ width: 'var(--radix-popover-trigger-width)' }}
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search employees..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                          {employeeData.map((emp) => (
                            <CommandItem
                              key={emp.partner}
                              onSelect={() => handleEmployeeSelect(emp)}
                              className="cursor-pointer hover:bg-gray-100"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{emp.partner}</span>
                                <span className="text-sm text-gray-500">{emp.name_first}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Employee Name{" "}
                  <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                      Required
                    </div>
                  </span>
                </label>
                <Input value={formData.employee_name || ''} disabled className="bg-gray-100" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Employee NIP{" "}
                  <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                      Required
                    </div>
                  </span>
                </label>
                <Input value={formData.employee_nip || ''} disabled className="bg-gray-100" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Employee Email{" "}
                  <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                      Required
                    </div>
                  </span>
                </label>
                <Input value={formData.created_by || ''} disabled className="bg-gray-100" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cost Center{" "}
                  <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                      Required
                    </div>
                  </span>
                </label>
                <Input value={formData.cost_center_bp || ''} disabled className="bg-gray-100" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Division{" "}
                  <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                      Required
                    </div>
                  </span>
                </label>
                <Input value={formData.division || ''} disabled className="bg-gray-100" />
              </div>
            </CardContent>
          </Card>

          {formData.dots_number.startsWith('V') && (
            <VendorInformationCard
              formData={formData}
              setFormData={setFormData}
              setBankDetails={setBankDetails}
            />
          )}

          {/* Payment Information Card */}
          {formData.dots_number.startsWith('E') ? (
            <PaymentInformationCard
              formData={formData}
              setFormData={setFormData}
              currencyList={currencyList}
              bankDetails={bankDetails}
              isLoadingPaymentInfo={isLoadingPaymentInfo}
            />
          ):(
            <VendorPaymentInformationCard
              formData={formData}
              setFormData={setFormData}
              currencyList={currencyList}
              bankDetails={bankDetails}
              isLoadingPaymentInfo={isLoadingPaymentInfo}
            />
          )}

          {formData.dots_number.startsWith('E')?(
            <>
              {/* Additional Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-500" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Event Name {" "}
                        <span className="text-red-500 relative group">
                            *
                            <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                            Required
                            </div>
                        </span>
                      </label>
                      <Input
                        value={formData.event || ''}
                        onChange={e => setFormData({ ...formData, event: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Client Name</label>
                      <Input
                        value={formData.client_name || ''}
                        onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <Textarea
                      value={formData.address || ''}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Purpose {" "}
                      <span className="text-red-500 relative group">
                          *
                          <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                          Required
                          </div>
                      </span>
                    </label>
                    <Textarea
                      value={formData.purpose || ''}
                      onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <PolicyNumberForm
                    setFormData={setFormData}
                    formData={formData}
                    isAcquisition={isAcquisition}
                  />
                </CardContent>
              </Card>
            </>
          ):(
            <>
              {/* Additional Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-500" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">Event Name {" "}
                        <span className="text-red-500 relative group">
                            *
                            <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                            Required
                            </div>
                        </span>
                      </label>
                      <Input
                        value={formData.event || ''}
                        onChange={e => setFormData({ ...formData, event: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Purpose {" "}
                        <span className="text-red-500 relative group">
                            *
                            <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                            Required
                            </div>
                        </span>
                      </label>
                    <Textarea
                      value={formData.purpose || ''}
                      onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <PolicyNumberForm
                    setFormData={setFormData}
                    formData={formData}
                    isAcquisition={isAcquisition}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* M-Files Section */}
          <MFilesSection setIsUploadMfiles={setIsUploadMFiles} formData={formData} group_code={groupCode} isAdmin={isAdmin} emailInputter={user.email}/>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isLoading}
            >
              {isLoadingUpdate ? (
                <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                    </>
                ) : (
                    <>
                        <span>Update Transaction</span>
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </Button>
          </div>
        </form>
      </div>
      <ConfirmationModal
        open={showConfirmationModal}
        onCancel={handleCancelNavigation}
        onConfirm={handleConfirmNavigation}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave this page?"
      />
    </Layout>
  );
};

export default UpdateTransaction;