import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, ArrowRight } from 'lucide-react'; 
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormData } from '../../types/newDots';
import React, { useState, useEffect, useCallback } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { BankDetail, ApiBankResponse } from '../../types/newDots';
import Swal from 'sweetalert2';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import { useRouter } from "next/navigation";

interface CurrencyResponse {
    status: string;
    data: {
        ref_id: string;
        ref_code: string;
        description: string;
    }[];
}

interface PropsVendor {
    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>; 
    currentStep: number;
    setCurrentStep: (value: number) => void;
    handleBack: (type: string) => void;
    dotsType: string | null | undefined;
    partner: string | null | undefined;
}

interface DecodedToken {
    exp: number;
}

const PaymentInformation: React.FC<PropsVendor> = ({
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    handleBack,
    partner,
    dotsType
}) => {
    const DotsEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
    const SapEndPoint = process.env.NEXT_PUBLIC_SAP_END_POINT;
    const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
    const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
    const [currencyList, setCurrencyList] = useState<CurrencyResponse['data']>([]);
    const [error, setError] = useState<string>('');
    const [selectedBankDetail, setSelectedBankDetail] = useState<BankDetail | null>(null);
    const [selectedCurrency, setSelectedCurrency] = useState<string>('');
    const [paymentType, setPaymentType] = useState<string>('');
    const [paymentDetails, setPaymentDetails] = useState<string>('');
    const [defaultIDRBankDetail, setDefaultIDRBankDetail] = useState<BankDetail | null>(null);
    const [isNoBankAccountMatches, setIsNoBankAccountMatches] = useState(false);
    const router = useRouter();
    const [isTokenLoading, setIsTokenLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
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

    const calculateDefaultDueDate = () => {
        const today = new Date();
        const defaultDueDate = new Date(today);
        defaultDueDate.setDate(today.getDate() + 8);
        return defaultDueDate.toISOString().split('T')[0];
    };

    const updateFormData = useCallback((updates: Partial<FormData>) => {
        setFormData((prev: FormData): FormData => ({
            ...prev,
            ...updates
        } as FormData));
    }, [setFormData]);


    useEffect(() => {
        const fetchCurrenciesAndBankDetails = async () => {
            setLoading(true);
            try {
                // Fetch currency data
                const currencyResponse = await axiosJWT.get(`${DotsEndPoint}/get/currency`);
                const currencyData: CurrencyResponse = await currencyResponse.data;
                setCurrencyList(currencyData.data);
                
                // Fetch bank data with error handling
                const bankResponse = await axios.get(`${SapEndPoint}/BussinesPartner/BankInfo?PARTNER=${partner}`);
                const bankResponseData: ApiBankResponse = await bankResponse.data;
                
                // Check if bank data is empty or not exist
                if (!bankResponseData?.data_result || bankResponseData.data_result.length === 0) {
                    await Swal.fire({
                        title: 'No Bank Data',
                        text: 'No bank account data found for this business partner',
                        icon: 'error',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#3085d6',
                        customClass: {
                            container: 'z-[1400]'
                        }
                    });
        
                    // Reset form data and states
                    setBankDetails([]);
                    setAvailableCurrencies([]);
                    setSelectedBankDetail(null);
                    setSelectedCurrency('');
                    setPaymentType('');
                    setIsNoBankAccountMatches(true);
                    
                    updateFormData({
                        currency: '',
                        paymentType: '',
                        bankAccountNo: '',
                        bankName: '',
                        accountName: '',
                        paymentRemark: '',
                        estimatePaymentDueDate: calculateDefaultDueDate()
                    });
                    
                    return;
                }
                
                // Continue with existing logic if bank data exists
                setBankDetails(bankResponseData.data_result);
                const currencySet = new Set(bankResponseData.data_result.map(detail => detail.Bkref));
                setAvailableCurrencies(Array.from(currencySet));
        
                const idrBankDetails = bankResponseData.data_result.filter(detail => detail.Bkref === 'IDR');
                
                if (bankResponseData.data_result.length === 0) {
                    setError('The BP must have an IDR bank account');
                    return;
                }
                
                if (idrBankDetails.length) {
                    const defaultIDR = idrBankDetails[0];
                    setDefaultIDRBankDetail(defaultIDR);
                    setSelectedBankDetail(defaultIDR);
                    setSelectedCurrency('IDR');
                    setPaymentType('Transfer');
                    
                    updateFormData({
                        currency: 'IDR',
                        paymentType: 'Transfer',
                        bankAccountNo: defaultIDR.Bankn,
                        bankName: defaultIDR.Banka,
                        accountName: defaultIDR.Koinh,
                        estimatePaymentDueDate: calculateDefaultDueDate()
                    });
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                
                await Swal.fire({
                    title: 'Error',
                    text: 'Failed to fetch bank details or currencies. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#3085d6',
                    customClass: {
                        container: 'z-[1400]'
                    }
                });
        
                // Reset states and form data on error
                setBankDetails([]);
                setAvailableCurrencies([]);
                setSelectedBankDetail(null);
                setSelectedCurrency('');
                setPaymentType('');
                setIsNoBankAccountMatches(true);
                setError('Failed to fetch bank details or currencies');
                
                updateFormData({
                    currency: '',
                    paymentType: '',
                    bankAccountNo: '',
                    bankName: '',
                    accountName: '',
                    paymentRemark: '',
                    estimatePaymentDueDate: calculateDefaultDueDate()
                });
            }finally{
                setLoading(false);
            }
        };

        if (partner && !isTokenLoading) {
            fetchCurrenciesAndBankDetails();
        }
    }, [partner, dotsType, updateFormData, token, axiosJWT]);

    const handleCurrencyChange = useCallback((value: string) => {
        const matchingBankDetails = bankDetails.filter(detail => detail.Bkref === value);
        setSelectedCurrency(value);
        
        if (value === 'IDR') {
            setPaymentType('Transfer');
            setIsNoBankAccountMatches(false);
            
            if (matchingBankDetails.length >= 1) {
                const defaultBank = matchingBankDetails[0];
                setSelectedBankDetail(defaultBank);
                updateFormData({
                    currency: value,
                    paymentType: 'Transfer',
                    ...defaultBank && {
                        bankAccountNo: defaultBank.Bankn,
                        bankName: defaultBank.Banka,
                        accountName: defaultBank.Koinh
                    }
                });
            }
        } else if (dotsType === 'employee') {
            if (matchingBankDetails.length === 0) {
                setPaymentType('Cash');
                setIsNoBankAccountMatches(false);
                updateFormData({
                    currency: value,
                    paymentType: 'Cash',
                    bankAccountNo: '',
                    bankName: '',
                    accountName: '',
                    paymentRemark: ''
                });
            } else {
                const firstMatchingBank = matchingBankDetails[0];
                setSelectedBankDetail(firstMatchingBank);
                setPaymentType('Transfer');
                setIsNoBankAccountMatches(false);
                updateFormData({
                    currency: value,
                    paymentType: 'Transfer',
                    bankAccountNo: firstMatchingBank.Bankn,
                    bankName: firstMatchingBank.Banka,
                    accountName: firstMatchingBank.Koinh
                });
            }
        } else {
            if (matchingBankDetails.length === 0) {
                setPaymentType('Transfer');
                setIsNoBankAccountMatches(true);
                updateFormData({
                    currency: value,
                    paymentType: 'Transfer',
                    bankAccountNo: '',
                    bankName: '',
                    accountName: ''
                });
                setSelectedBankDetail(null);
            } else {
                const firstMatchingBank = matchingBankDetails[0];
                setSelectedBankDetail(firstMatchingBank);
                setPaymentType('Transfer');
                setIsNoBankAccountMatches(false);
                updateFormData({
                    currency: value,
                    paymentType: 'Transfer',
                    bankAccountNo: firstMatchingBank.Bankn,
                    bankName: firstMatchingBank.Banka,
                    accountName: firstMatchingBank.Koinh,
                    estimatePaymentDueDate: calculateDefaultDueDate()
                });
            }
        }
    }, [bankDetails, dotsType, updateFormData]);

    const getPaymentTypeOptions = () => {
        const matchingBankDetails = bankDetails.filter(detail => detail.Bkref === selectedCurrency);
        
        if (dotsType === 'vendor' && matchingBankDetails.length > 0) {
            return <SelectItem value="Transfer">Bank Transfer</SelectItem>;
        }
        
        if (dotsType === 'employee' && matchingBankDetails.length === 0) {
            return <SelectItem value="Cash">Cash</SelectItem>;
        }
        
        if (isNoBankAccountMatches) {
            return <SelectItem value="Cash">No Bank Account</SelectItem>;
        }
        
        return null;
    };

    const disabledState = selectedCurrency === 'IDR' || dotsType === 'employee' || isNoBankAccountMatches === true;

    const handlePaymentTypeChange = (value: string) => {
        setPaymentType(value);
        setFormData({
            ...formData,
            paymentType: value
        });
    };

    const handlePaymentDetailChange = (value: string) => {
        setPaymentDetails(value);
        setFormData({
            ...formData,
            paymentRemark: value
        });
    };

    const isRequiredFieldsFilled = (): boolean => {
        console.log(formData, 'FORM DATA==============');
        const isPaymentDetailsRequired = 
            (dotsType === 'employee' && paymentType === 'Cash') ||
            (selectedCurrency !== 'IDR' && paymentType === 'Cash') || 
            (dotsType === 'vendor' && paymentType === 'Cash');
        if(formData.paymentType !== 'Transfer'){
            return !!(
                formData.currency &&
                formData.paymentType &&
                formData.paymentRemark &&
                formData.estimatePaymentDueDate &&
                (!isPaymentDetailsRequired || (isPaymentDetailsRequired && paymentDetails))
            );
        }else{
            return !!(
                formData.currency &&
                formData.paymentType &&
                formData.estimatePaymentDueDate &&
                formData.bankAccountNo &&
                formData.accountName &&
                formData.bankName &&
                (!isPaymentDetailsRequired || (isPaymentDetailsRequired && paymentDetails))
            );
        }
    };

    const handleNextStep = () => {
        if (isRequiredFieldsFilled()) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBankAccountChange = (accountNumber: string) => {
        const selectedBank = bankDetails.find(detail => detail.Bankn === accountNumber);
        
        if (selectedBank) {
            setSelectedBankDetail(selectedBank);
            setFormData({
                ...formData,
                bankAccountNo: selectedBank.Bankn,
                bankName: selectedBank.Banka,
                accountName: selectedBank.Koinh
            });
        }
    };

    const renderBankAccountField = () => {
        const filteredBankDetails = bankDetails.filter(detail => detail.Bkref === selectedCurrency);
        
        if (filteredBankDetails.length === 1) {
            const singleBank = filteredBankDetails[0];
            return (
                <Input 
                    value={singleBank.Bankn}
                    disabled 
                    className="bg-gray-100"
                />
            );
        }
        
        if (filteredBankDetails.length > 1) {
            return (
                <Select 
                    onValueChange={handleBankAccountChange}
                    value={formData.bankAccountNo}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredBankDetails.map(detail => (
                            <SelectItem key={detail.Bankn} value={detail.Bankn}>
                                {`${detail.Banka} - ${detail.Bankn}`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }
        
        return (
            <Input 
                value="No available bank account" 
                disabled 
                className="bg-gray-100"
            />
        );
    };

    useEffect(() => {
        if (error) {
            const errorModal = Swal.fire({
                title: 'Error',
                text: error,
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#3085d6',
                customClass: {
                    container: 'z-[1400]'
                }
            });

            errorModal.then(() => {
                setError('');
            });
    
            return () => {
                Swal.close();
            };
        }
    }, [error]);

    if (isTokenLoading || loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-6">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                        <p className="text-sm text-gray-600">Loading Bank ...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                        <CreditCard className="w-6 h-6 text-blue-500" />
                        <span>Payment Information</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Currency Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Currency <span className="text-red-500 relative group">
                                    *
                                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                        Required
                                    </div>
                                </span>
                            </label>
                            <Select 
                                onValueChange={handleCurrencyChange} 
                                value={selectedCurrency}
                                required
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={formData.currency || "Select currency"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencyList.map((currency) => (
                                        <SelectItem key={currency.ref_code} value={currency.ref_code}>
                                            {`${currency.ref_code} - ${currency.description}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
    
                        {/* Payment Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Type <span className="text-red-500 relative group">
                                    *
                                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                        Required
                                    </div>
                                </span>
                            </label>
                            <Select 
                                onValueChange={handlePaymentTypeChange}
                                value={paymentType || formData.paymentType}
                                disabled={disabledState}
                                required
                            >
                                <SelectTrigger className={`w-full ${disabledState ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                                    <SelectValue placeholder={formData.paymentType || isNoBankAccountMatches === true ? "No available bank account" : "Select Payment Type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {getPaymentTypeOptions()}
                                </SelectContent>
                            </Select>
                        </div>
    
                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date <span className="text-red-500 relative group">
                                    *
                                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                        Required
                                    </div>
                                </span>
                            </label>
                            <Input
                                type="date"
                                className="w-full cursor-not-allowed bg-gray-100"
                                value={formData.estimatePaymentDueDate || calculateDefaultDueDate()}
                                disabled
                                required
                            />
                        </div>
                    </div>
    
                    {/* Payment Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Details{" "}
                            {((selectedCurrency !== 'IDR' && paymentType === 'Cash') || 
                              (dotsType === 'vendor' && paymentType === 'Cash')) && 
                                <span className="text-red-500 relative group">
                                    *
                                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                        Required
                                    </div>
                                </span>
                            }
                        </label>
                        <Textarea 
                            placeholder="Enter payment details or special instructions"
                            className="min-h-32"
                            value={paymentDetails || formData.paymentRemark}
                            onChange={(e) => handlePaymentDetailChange(e.target.value)}
                            required={
                                (selectedCurrency !== 'IDR' && paymentType === 'Cash') || 
                                (dotsType === 'vendor' && paymentType === 'Cash')
                            }
                        />
                    </div>
    
                    {/* Bank Details Section */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Bank Account */}
                        <div className='truncate'>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Account{" "}
                            {paymentType === 'Transfer'  && 
                                <span className="text-red-500 relative group">
                                    *
                                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                        Required
                                    </div>
                                </span>
                            }
                            </label>
                            {renderBankAccountField()}
                        </div>
                        
                        {/* Bank Name */}
                        <div className='truncate'>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Name{" "}
                            {paymentType === 'Transfer'  && 
                                <span className="text-red-500 relative group">
                                    *
                                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                        Required
                                    </div>
                                </span>
                            }
                            </label>
                            <Input 
                                value={formData.bankName || 'No available bank name'} 
                                disabled 
                                className="bg-gray-100"
                            />
                        </div>
                        
                        {/* Account Name */}
                        <div className='truncate'>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Name{" "}
                            {paymentType === 'Transfer'  && 
                                <span className="text-red-500 relative group">
                                    *
                                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                        Required
                                    </div>
                                </span>
                            }
                            </label>
                            <Input 
                                value={formData.accountName || 'No available account name'} 
                                disabled 
                                className="bg-gray-100"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
    
            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
                <Button 
                    variant="outline"
                    onClick={() => handleBack('paymentInformation')}
                    className="flex items-center space-x-2 hover:bg-gray-100"
                >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    <span>Back</span>
                </Button>
                <Button 
                    onClick={handleNextStep}
                    disabled={!isRequiredFieldsFilled()}
                    className={`flex items-center space-x-2 ${
                        isRequiredFieldsFilled() 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-gray-300 cursor-not-allowed text-gray-500'
                    }`}
                >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}


export default PaymentInformation;