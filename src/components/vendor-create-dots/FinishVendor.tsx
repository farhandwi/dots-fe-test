import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowRight, Briefcase, CreditCard, Building, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormData} from '../../types/newDots';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitTransaction } from '@/lib/api/CreateDots';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import axios from 'axios';

interface DecodedToken {
    exp: number;
}

interface Role {
    bp: string;
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

// Define PropsVendor interface
interface PropsFinishEmployee {
    formData: FormData;
    handleBack: (type: string) => void;
    user: User | null;
    doc_type: string | null;
}

const FinishVendor: React.FC <PropsFinishEmployee> = ({
    formData,
    handleBack,
    user,
    doc_type
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { submitTransaction } = useSubmitTransaction();

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

    const handleSubmit = async () => {
        if (isSubmitting && !isTokenLoading) return;
        
        try {
            setIsSubmitting(true);
            
            if (!user || !doc_type) {
                throw new Error('User or document type not available');
            }

            const result = await submitTransaction(formData, doc_type, user, axiosJWT);
            
            router.push(`/detail/${result}`);
            
        } catch (error) {
            console.error('Error submitting transaction:', error);
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="space-y-6 animate-fadeIn">
        {/* Transaction Details Section */}
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
            <Briefcase className="w-6 h-6 text-blue-500" />
            <span>Transaction Details</span>
            </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number{" "}
            <span className="text-red-500 relative group">
            *
            <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                Required
            </div>
            </span>
            </label>
            <Input placeholder="Enter invoice number" className="w-full" value={formData.invoiceNumber} disabled/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Memo Number</label>
            <Input placeholder="Enter memo number" className="w-full" value={formData.memoNumber} disabled/>
            </div>
            <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Memo Link</label>
            <div className="flex space-x-2">
            <Input placeholder="Enter memo link" className="w-full" value={formData.memoLink} disabled/>
            <Button variant="outline" className="flex-shrink-0">
                <ArrowRight className="w-4 h-4" />
            </Button>
            </div>
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full border rounded-md px-3 py-1.5 bg-white"
                value={formData.startDate}
                placeholder="Select start date"
                disabled
                />
            </div>
            </div>
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
                    className="w-full border rounded-md px-3 py-1.5 bg-white"
                    value={formData.endDate}
                    placeholder="Select end date"
                    disabled
                />
            </div>
            </div>
            </div>
            </CardContent>
        </Card>

        {/* Employee Information Section */}
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-500" />
            <span>Employee Information</span>
            </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Partner{" "}
                    <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                        </div>
                    </span>
                </label>
                <Input placeholder="Employee NIP" value={formData.businessPartner} disabled />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee NIP{" "}
                <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                    Required
                    </div>
                </span>
                </label>
                <Input placeholder="Employee NIP" value={formData.employeeNIP} disabled />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Center{" "}
                <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                    Required
                    </div>
                </span>
                </label>
                <Input placeholder="Cost center" value={formData.costCenter} disabled />
            </div>
            </div>

            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name{" "}
                    <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                    </div>
                    </span>
                </label>
                <Input placeholder="Employee name" value={formData.employeeName} disabled />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Email{" "}
                    <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                    </div>
                    </span>
                </label>
                <Input type="email" placeholder="Employee email" value={formData.employeeEmail} disabled />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division{" "}
                    <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                    </div>
                    </span>
                </label>
                <Input placeholder="Division" value={formData.costCenterDesc} disabled />
            </div>
            </div>
        </CardContent>
        </Card>

        {/* Vendor Information Section */}
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                    <CreditCard className="w-6 h-6 text-blue-500" />
                    <span>Vendor Information</span>
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                <div className="grid md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID{" "}
                    <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                    </div>
                    </span>
                </label>
                <Input type="text" value={formData.clientNumber} className="w-full"  disabled/>

                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <Input 
                    placeholder="Client name" 
                    type='text' 
                    className="w-full" 
                    value={formData.clientName}
                    disabled
                />
                </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <Textarea 
                    placeholder="Enter address"
                    className="min-h-32"
                    value={formData.address}
                    disabled
                />
                </div>
                </CardContent>
            </Card>

        {/* Payment Information Section */}
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                <CreditCard className="w-6 h-6 text-blue-500" />
                <span>Payment Information</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                
                <div className="grid md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="Currency" value={formData.currency} disabled />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="payment type" value={formData.paymentType} disabled />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date {" "}
                    <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                        </div>
                    </span>
                    </label>
                    <input
                    type="date"
                    className="w-full border rounded-md px-3 py-1"
                    value={formData.estimatePaymentDueDate}
                    disabled
                    />
                </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Details
                </label>
                <Textarea 
                    placeholder="Enter payment details or special instructions"
                    className="min-h-32"
                    value={formData.paymentRemark}
                    disabled
                />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                    <Input placeholder="Bank Account" value={formData.bankAccountNo} disabled />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <Input 
                    placeholder="Bank name" 
                    value={formData.bankName} 
                    disabled 
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <Input 
                    placeholder="Account holder name" 
                    value={formData.accountName} 
                    disabled 
                    />
                </div>
                </div>
            </CardContent>
        </Card>

        {/* Additional Information Section */}
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                    <Building className="w-6 h-6 text-blue-500" />
                    <span>Additional Information</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                {/* Event Name */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                        <Input 
                            placeholder="event name" 
                            value={formData.event || '-'} 
                            disabled 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                        <Input 
                            placeholder="Policy Number" 
                            value={formData.policyNumber || '-'}
                            disabled 
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                    <Input 
                        placeholder="purpose" 
                        value={formData.purpose || '-'}
                        disabled 
                    />
                </div>

                
            </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
        <Button 
            variant="outline"
            onClick={()=>handleBack('finishEmployee')}
            className="flex items-center space-x-2 hover:bg-gray-100"
        >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back</span>
        </Button>
        <Button 
            type="submit"
            className="bg-blue-500 text-white hover:bg-blue-600 flex items-center space-x-2"
            onClick={()=> handleSubmit()}
        >
            {isSubmitting ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    <span>Submit Transaction</span>
                    <ArrowRight className="w-4 h-4" />
                </>
            )}
        </Button>
        </div>
        </div>
    )
}

export default FinishVendor;