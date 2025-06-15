"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2,ArrowLeft} from 'lucide-react';
import {useRouter} from 'next/navigation';
import EmployeeForm from '@/components/forms/EmployeeForm';
import VendorForm from '@/components/forms/VendorForm';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import { TransactionType, FormData } from '@/types/newDots';
import StepCreateDotsIndicator from '@/components/StepCreateDotsIndicator';
import CostCenterInformation from '@/components/employee-create-dots/CostCenterInformation';
import FormTypeInformation from '@/components/employee-create-dots/FormTypeInformation';
import CategoryInformation from '@/components/employee-create-dots/CategoryInformation';
import TransactionDetail from '../../components/employee-create-dots/TransactionDetail';
import EmployeeInformation from '@/components/employee-create-dots/EmployeeInformation';
import PaymentInformation from '@/components/employee-create-dots/PaymentInformation';
import AdditionalInformation from '@/components/employee-create-dots/AdditionalInformation';
import FinishEmployee from '@/components/employee-create-dots/FinishEmployee';
import TransactionDetailVendor from '@/components/vendor-create-dots/TransactionDetail';
import EmployeeInformationVendor from '@/components/vendor-create-dots/EmployeeInformation';
import PaymentInformationVendor from '@/components/vendor-create-dots/PaymentInformation';
import AdditionalInformationVendor from '@/components/vendor-create-dots/AdditionalInformation';
import VendorInformation from '@/components/vendor-create-dots/VendorInformation';
import FinishVendor from '@/components/vendor-create-dots/FinishVendor';
import CostCenterVendorInformation from '@/components/vendor-create-dots/CostCenterInformation';
import DestinationScopeSelection from '@/components/employee-create-dots/DestinationInformation';
import DestinationScopeVendorSelection from '@/components/vendor-create-dots/DestinationInformation';
import CardPaymentInformation from '@/components/employee-create-dots/PaymentSpecialInformation';
import { Layout } from '@/components/Layout';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';

interface DecodedToken {
    exp: number;
}

interface ResetFormConfig {
  setFormData: (value: FormData) => void;
  setFormType?: (value: string) => void;
  setCategory?: (value: string) => void;
  setCostCenters?: (value: string) => void;
  setCurrentStep?: (value: number) => void;
}

interface Role {
  bp: string;
  em_cost_center: string | null;
  cost_center: string | null;
  user_type: string;
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
  }
}

type User = {
  partner: string;
  email: string;
  cost_center: string;
  application: Application[];
};

export default function CreateTransaction() {
  const [selectedType, setSelectedType] = useState<TransactionType>(null);
  const [formType, setFormType] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [showBackConfirmationData, setShowBackConfirmation] = useState(false);
  const [type, setType] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [currentDotsType, setCurrentDotsType] = useState<string | null>('');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [pendingType, setPendingType] = useState<TransactionType>(null);
  const [showBackToListConfirmation, setShowBackToListConfirmation] = useState(false);
  const [role, setRole] = useState<Role[] | null>([]);
  const { user, isLoading} = useAuth() as { 
    user: User | null; 
    isLoading: boolean; 
  };

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
        router.push('/login');
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

  const [partner, setPartner] = useState<string | undefined>('');
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
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
    clientNumber: '',
    clientName: '',
    invoiceNumber: '',

    // Employee Info fields
    businessPartner: '',
    employeeNIP: '',
    employeeName: '',
    employeeEmail: '',
    costCenterDesc: '',
    costCenter: '',
    costCenterInputter: '',
    
    // Payment Information fields
    currency: '',
    paymentType: '',
    estimatePaymentDueDate: '',
    paymentRemark: '',
    bankAccountNo: '',
    bankName: '',
    accountName: '',
    destination_scope: '',
    region_group: ''
  });

  const handleBackToList = () => {
    if (hasFilledData(formData)) {
      setShowBackToListConfirmation(true);
    } else {
      router.push('/show');
    }
  };

  const handleConfirmBackToList = useCallback(async (confirm: boolean) => {
    setShowBackToListConfirmation(false);
    
    if (confirm) {
      try {
        // Reset form data
        resetAllFormData({
          setFormData
        });
        
        // Tunggu sedikit sebelum navigasi
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Navigasi ke halaman show
        router.push('/show');
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  }, [router, setFormData]);

  // Fungsi untuk membuat initial state FormData
  const getInitialFormData = (): FormData => ({
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

  function getRolesByApplicationName(
    applications: Application[],
    targetName: string
  ): Role[] | null {
    const app = applications.find((app) => app.app_name === targetName);
    return app ? app.role : null;
  }

  const [costCenters, setCostCenters] = useState('');
  const [searchValue, setSearchValue] = useState('');

  const hasFilledData = (formData: FormData) => {
    return Object.values(formData).some(value => 
      value !== '' && 
      value !== null && 
      value !== undefined
    );
  };

  const useHandleBrowserBack = (formData: FormData, setFormData: (value: FormData) => void) => {
    const router = useRouter();
    const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  
    useEffect(() => {
      window.history.pushState(null, '', window.location.pathname);
  
      const handlePopState = (event: PopStateEvent) => {
        event.preventDefault();
        
        if (hasFilledData(formData)) {
          window.history.pushState(null, '', window.location.pathname);
          setShowBackConfirmation(true);
        } else {
          router.back();
        }
      };
  
      window.addEventListener('popstate', handlePopState);
  
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }, [formData, router]);
  
    const handleConfirmBack = (confirm: boolean) => {
      setShowBackConfirmation(false);
      if (confirm) {
        resetAllFormData({setFormData});
        router.back();
      } else {
        window.history.pushState(null, '', window.location.pathname);
      }
    };
  
    return { showBackConfirmation, handleConfirmBack };
  };

  const { showBackConfirmation, handleConfirmBack } = useHandleBrowserBack(formData, setFormData);

  const resetAllFormData = (config: ResetFormConfig) => {
    const {
      setFormData,
      setFormType,
      setCategory,
      setCostCenters,
      setCurrentStep
    } = config;
  
    // Reset form data utama
    setFormData(getInitialFormData());

    // Reset state lainnya jika setter-nya tersedia
    setFormType?.('');
    setCategory?.('');
    setCostCenters?.('');
    setCurrentStep?.(1);
  };

  const handleTypeSelect = (type: TransactionType) => {
    if (formType || category || costCenters) {
      setShowConfirmation(true);
      setCurrentDotsType(type);
      setPendingType(type);
    } else {
      setSelectedType(currentType => (currentType === type ? null : type));
      setCurrentDotsType(type);
      resetAllFormData({setFormData,setFormType,setCategory, setCostCenters, setCurrentStep});
    }
  };

  const confirmChange = (confirm: boolean) => {
    setShowConfirmation(false);
    if (confirm && pendingType !== null) {
      setSelectedType(currentType => (currentType === pendingType ? null : pendingType));
      resetAllFormData({setFormData,setFormType,setCategory, setCostCenters, setCurrentStep});
    }
    setPendingType(null);
  };

  const isEmpty = (value: string): boolean => {
    return value === '' || value === null || value === undefined;
  };

  const areFieldsFilled = (formData: FormData, fields: (keyof FormData)[]): boolean => {
    return fields.some((field:(keyof FormData)) => formData[field] !== null && formData[field] !== '' && formData[field] !== undefined);
  };

  const hasFilledDataSpesific = (formData: FormData, type: string): boolean => {
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

  const resetSpecificFields = (
    type: string
  ) => {
    const newData = { ...formData };
    const getFieldsToReset = (type: string): (keyof FormData)[] => {
      switch (type) {
        case 'transactionDetail':
          return ['memoNumber', 'memoLink', 'startDate', 'endDate'];
        case 'employeeInformation':
          return ['businessPartner', 'employeeNIP', 'employeeName', 'employeeEmail'];
        case 'vendorInformation':
          return ['clientNumber', 'clientName', 'address'];
        case 'destinationInformation':
          return ['destination_scope', 'region_group'];
        case 'paymentInformation':
          return [
            'currency',
            'paymentType',
            'estimatePaymentDueDate',
            'paymentRemark',
            'bankAccountNo',
            'bankName',
            'accountName'
          ];
        case 'additionalInformation':
          return [
            'event',
            'purpose',
            'policyNumber',
            'clientName',
          ];
        case 'formType':
          return [
            'formType'
          ]
        case 'category':
          return [
            'category'
          ]
        case 'costCenter':
          return [
            'costCenter',
            'costCenterDesc'
          ];
        default:
          return [];
      }
    };
    
    // Get fields to reset
    const fieldsToReset = getFieldsToReset(type);
    // Reset only the specified fields
    fieldsToReset.forEach(field => {
      newData[field] = '';
    });
    // Set the new data
    setFormData(newData);
  };

  const handleBackClick = (
    type: string,
  ) => {
    setType(type);
    if (hasFilledDataSpesific(formData, type)) {
      setShowBackConfirmation(true);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmBackData = (confirm: boolean) => {
    setShowBackConfirmation(false);
    if (confirm) {
      resetSpecificFields(type);
      setCurrentStep(currentStep - 1);
    }
};

  const renderStepEmployeeIndicator = () => (
    <StepCreateDotsIndicator currentStep={currentStep} DotsType={currentDotsType}/>
  );

  const renderFormType = () => {
    return (
      <FormTypeInformation
        formData={formData}
        setFormData={setFormData}
        setCurrentStep={setCurrentStep}
        setFormType={setFormType}
        formType={formType}
        handleBack={handleBackClick}
      />
    );
  };

  const renderDestinationInformation = () => {
    return (
      <DestinationScopeSelection
        setFormData={setFormData}
        formData={formData}
        dotsType={currentDotsType}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
      />
    )
  }

  const renderVendorDestinationInformation = () => {
    return (
      <DestinationScopeVendorSelection
        setFormData={setFormData}
        formData={formData}
        dotsType={currentDotsType}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
      />
    )
  }

  const renderTransactionDetailStep = () => {
    return(
      <TransactionDetail
        formData={formData}
        setFormData={setFormData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
      />
    )
  }

  const renderEmployeeInformation = () => {
    return (
      <EmployeeInformation
        formData={formData}
        setFormData={setFormData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
        setPartner={setPartner}
      />
    )
  }

  const renderPaymentInformation = () => {
    return (
      <PaymentInformation
        formData={formData}
        setFormData={setFormData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
        dotsType={currentDotsType}
        partner={partner}
      />
    )
  }

  const renderAdditionalInformation = () => {
    return (
      <AdditionalInformation
        formData={formData}
        setFormData={setFormData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
      />
    )
  }

  const renderFinishEmployee = () => {
    return (
      <FinishEmployee
        formData={formData}
        handleBack={handleBackClick}
        user={user}
        doc_type={currentDotsType}
      />
    )
  }


  const renderVendorTransactionDetailStep = () => {
    return(
      <TransactionDetailVendor
        formData={formData}
        setFormData={setFormData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
      />
    )
  }
  const renderVendorInformationStep = () => {
    return(
      <VendorInformation
        formData={formData}
        setFormData={setFormData}
        setPartner={setPartner}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
      />
    )
  }

  const renderVendorEmployeeInformation = () => {
    return (
      <EmployeeInformationVendor
        formData={formData}
        setFormData={setFormData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
      />
    )
  }
  const renderVendorCostCenterStep = () => {
    return (
      <CostCenterVendorInformation
        formData={formData}
        setFormData={setFormData}
        setCurrentStep={setCurrentStep}
        currentStep={currentStep}
        setCostCenter={setCostCenters}
        user={user}
        isLoading={isLoading}
        handleBack={handleBackClick}
      />
    )
  }

  const renderVendorPaymentInformation = () => {
    return (
      <PaymentInformationVendor
        formData={formData}
        setFormData={setFormData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
        dotsType={currentDotsType}
        partner={partner}
      />
    )
  }

  const renderVendorAdditionalInformation = () => {
    return (
      <AdditionalInformationVendor
        formData={formData}
        setFormData={setFormData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
      />
    )
  }

  const renderPaymentSpecialInformation = () => {
    return (
      <CardPaymentInformation
        formData={formData}
        setFormData={setFormData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
      />
    )
  }

  const renderFinishVendor = () => {
    return (
      <FinishVendor
        formData={formData}
        handleBack={handleBackClick}
        user={user}
        doc_type={currentDotsType}
      />
    )
  }

  const renderCostCenterStep = () => {
    return(
      <CostCenterInformation 
        formData={formData}
        setFormData={setFormData}
        setCurrentStep={setCurrentStep}
        currentStep={currentStep}
        setCostCenter={setCostCenters}
        user={user}
        isLoading={isLoading}
        handleBack={handleBackClick}
      />
    )
  };

  const renderCategoryStep = () => {
    return (
      <CategoryInformation  
        formData={formData}
        setFormData={setFormData}
        setCategory={setCategory}
        setCurrentStep={setCurrentStep}
        handleBack={handleBackClick}
      />
    )
  };

  const renderTypeSelection = () => (
    <div className="container mx-auto md:px-4 px-0 pb-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-center justify-center mb-6">
        <div className="w-full text-center md:w-1/3 mb-4 md:mb-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Create New Transaction
          </h1>
          <p className="text-gray-600 mt-2">Select transaction type to continue</p>
        </div>
      </div>
  
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 max-w-2xl mx-auto items-center justify-center">
        <Card
          className="w-full mx-auto group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-lg"
          onClick={() => handleTypeSelect('employee')}
        >
          <CardContent
            className={`p-4 ${selectedType == 'employee' ? 'bg-gray-200' : 'bg-white'} rounded-lg h-32`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-gray-800 text-center">
                Create DOTS Employee
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card
          className="w-full mx-auto group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-lg"
          onClick={() => handleTypeSelect('vendor')}
        >
          <CardContent
            className={`p-4 ${selectedType == 'vendor' ? 'bg-gray-200' : 'bg-white'} rounded-lg h-32`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-gray-800 text-center">
                Create DOTS Vendor
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pop-up Konfirmasi Back to List */}
      {showBackToListConfirmation && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-4">
            <h2 className="text-xl font-semibold text-gray-800">Confirmation</h2>
            <p className="mt-4 text-gray-600">
              Are you sure you want to return to the list? All entered data will be lost.
            </p>
            <div className="flex justify-end mt-6 space-x-4">
              <Button
                variant="secondary"
                onClick={() => handleConfirmBackToList(false)}
                className="text-black bg-gray-300 hover:bg-gray-400"
              >
                No
              </Button>
              <Button
                variant="secondary"
                className="text-black bg-gray-300 hover:bg-gray-400"
                onClick={() => handleConfirmBackToList(true)}
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}
  
      {/* Pop-up Konfirmasi Type Change */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-4">
            <h2 className="text-xl font-semibold text-gray-800">Confirmation</h2>
            <p className="mt-4 text-gray-600">
              Are you sure you want to change Dots Type? (previous data will be lost)
            </p>
            <div className="flex justify-end mt-6 space-x-4">
              <Button
                variant="secondary"
                onClick={() => confirmChange(false)}
                className="text-black bg-gray-300 hover:bg-gray-400"
              >
                No
              </Button>
              <Button
                variant="secondary"
                className="text-black bg-gray-300 hover:bg-gray-400"
                onClick={() => confirmChange(true)}
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEmployeeForm = () => {
    return (
      <EmployeeForm
        formData={formData}
        currentStep={currentStep}
        renderPaymentSpecialInformation={renderPaymentSpecialInformation}
        renderStepEmployeeIndicator={renderStepEmployeeIndicator}
        renderInitialStep={renderFormType}
        renderCategoryStep={renderCategoryStep}
        renderDestinationStep={renderDestinationInformation}
        renderCostCenterStep={renderCostCenterStep}
        renderTransactionDetail={renderTransactionDetailStep}
        renderPaymentInformation={renderPaymentInformation}
        renderEmployeeInformation={renderEmployeeInformation}
        renderAdditionalInformation={renderAdditionalInformation}
        renderFinishEmployee={renderFinishEmployee}
        dotsType={currentDotsType}
        partner={user?.partner}
      />
    );
  };

  const renderVendorForm = () => {
    return (
      <VendorForm
      currentStep={currentStep}
      renderVendorDestinationInformation={renderVendorDestinationInformation}
      renderStepEmployeeIndicator={renderStepEmployeeIndicator}
      renderCostCenterStep={renderVendorCostCenterStep}
      renderTransactionDetail={renderVendorTransactionDetailStep}
      renderPaymentInformation={renderVendorPaymentInformation}
      renderVendorInformation={renderVendorInformationStep}
      renderEmployeeInformation={renderVendorEmployeeInformation}
      renderAdditionalInformation={renderVendorAdditionalInformation}
      renderFinishVendor={renderFinishVendor}
      dotsType={currentDotsType}
      partner={user?.partner}
    />
    );
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen w-full">
        <div className="w-full md:w-1/3 mb-4 md:mb-0 md:pl-40 pl-0">
          <Button
            variant="link"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            onClick={handleBackToList}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to List
          </Button>
        </div>
        {renderTypeSelection()}
          {selectedType === 'employee' && renderEmployeeForm()}
          {selectedType === 'vendor' && renderVendorForm()}

          {/* Pop-up Konfirmasi untuk Browser Back */}
          {showBackConfirmation && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
              <h2 className="text-xl font-semibold text-gray-800">Confirmation</h2>
              <p className="mt-4 text-gray-600">
                Are you sure you want to leave this page? All entered data will be lost.
              </p>
              <div className="flex justify-end mt-6 space-x-4">
                <Button
                  variant="secondary"
                  onClick={() => handleConfirmBack(false)}
                  className="text-black bg-gray-300 hover:bg-gray-500"
                >
                  Stay
                </Button>
                <Button
                  variant="secondary"
                  className="text-black bg-gray-300 hover:bg-gray-500"
                  onClick={() => handleConfirmBack(true)}
                >
                  Leave
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Pop-up Konfirmasi */}
        {showBackConfirmationData && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
                  <h2 className="text-xl font-semibold text-gray-800">Confirmation</h2>
                  <p className="mt-4 text-gray-600">
                  Are you sure you want to go back? All entered data will be lost.
                  </p>
                  <div className="flex justify-end mt-6 space-x-4">
                  <Button
                      variant="secondary"
                      onClick={() => handleConfirmBackData(false)}
                      className="text-black bg-gray-300 hover:bg-gray-500"
                  >
                      No
                  </Button>
                  <Button
                      variant="secondary"
                      className="text-black bg-gray-300 hover:bg-gray-500"
                      onClick={() => handleConfirmBackData(true)}
                  >
                      Yes
                  </Button>
                  </div>
              </div>
          </div>
        )}
        
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }
        `}</style>
      </div>
    </Layout>
  );
}