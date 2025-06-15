import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormData} from '../../types/newDots';
import { Users, ArrowRight, Briefcase, CreditCard, Building, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitTransaction } from '@/lib/api/CreateDots';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import { useRouter } from "next/navigation";

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

interface DecodedToken {
    exp: number;
}

interface PropsFinishEmployee {
    formData: FormData;
    handleBack: (type: string) => void;
    user: User | null;
    doc_type: string | null;
}

const FinishEmployee: React.FC <PropsFinishEmployee> = ({
    formData,
    handleBack,
    user,
    doc_type
}) => {

    const [isSubmitting, setIsSubmitting] = useState(false);
    const { submitTransaction } = useSubmitTransaction();
    const router = useRouter();
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

    const handleSubmit = async () => {
        if (isSubmitting || isTokenLoading) return;
        
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
            <CardContent className="grid md:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                {/* Form Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form Type{" "}
                    <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                        </div>
                    </span>
                    </label>
                    <Input 
                    value={formData.formType}
                    disabled
                    className="w-full bg-gray-100"
                    />
                </div>
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
                        type="date"
                        className="w-full border rounded-md px-3 py-1"
                        value={formData.startDate}
                        disabled
                    />
                </div>
                </div>
                {/* Memo Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Memo Number</label>
                    <Input 
                    placeholder="Enter memo number" 
                    className="w-full bg-gray-100"
                    value={formData.memoNumber}
                    disabled
                    />
                </div>
                </div>
                <div className="space-y-4">
                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category{" "}
                    <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                        </div>
                    </span>
                    </label>
                    <Input 
                    value={formData.category}
                    disabled
                    className="w-full bg-gray-100"
                    />
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
                    type="date"
                    className="w-full border rounded-md px-3 py-1"
                    value={formData.endDate}
                    disabled
                    />
                </div>
                </div>
                {/* Memo Link */}
                <div className="flex space-x-2">
                    <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Memo Link</label>
                    <Input 
                        placeholder="Enter memo link"
                        value={formData.memoLink}
                        className="w-full bg-gray-100"
                        disabled
                    />
                    </div>
                    <Button variant="outline" className="mt-6">
                    <ArrowRight className="w-4 h-4" />
                    </Button>
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
                <Input placeholder="Employee NIP" value={formData.businessPartner} disabled className="w-full bg-gray-100"/>
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
                <Input placeholder="Employee NIP" value={formData.employeeNIP} className="w-full bg-gray-100" disabled />
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
                <Input placeholder="Cost center" value={formData.costCenter} className="w-full bg-gray-100" disabled />
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
                <Input placeholder="Employee name" value={formData.employeeName} className="w-full bg-gray-100" disabled />
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
                <Input type="email" placeholder="Employee email" value={formData.employeeEmail} className="w-full bg-gray-100" disabled />
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
                <Input placeholder="Division" value={formData.costCenterDesc} className="w-full bg-gray-100" disabled />
            </div>
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
                    <Input placeholder="Currency" value={formData.currency} className="w-full bg-gray-100" disabled />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="payment type" value={formData.paymentType} className="w-full bg-gray-100" disabled />
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
                    className="min-h-32 bg-gray-100"
                    value={formData.paymentRemark}
                    disabled
                />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                    <Input placeholder="Bank Account" value={formData.bankAccountNo} className="w-full bg-gray-100" disabled />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <Input 
                    placeholder="Bank name" 
                    className="w-full bg-gray-100"
                    value={formData.bankName} 
                    disabled 
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <Input 
                    placeholder="Account holder name" 
                    value={formData.accountName} 
                    className="w-full bg-gray-100"
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
            <div className="grid md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name{" "}
                    <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                    </div>
                    </span>
                </label>
                <Input placeholder="Enter event name" value={formData.event} className="w-full bg-gray-100" disabled/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <Input placeholder="Enter client name" value={formData.clientName} className="w-full bg-gray-100" disabled />
            </div>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address{" "}
                    <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                    </div>
                    </span>
                </label>
            <Textarea 
                placeholder="Enter complete address"
                className="min-h-32 bg-gray-100"
                value={formData.address}
                disabled
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose{" "}
                    <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                    </div>
                    </span>
                </label>
            <Textarea 
                placeholder="Enter purpose of transaction"
                className="min-h-32 bg-gray-100"
                value={formData.purpose}
                disabled
            />
            </div>

            <div className="grid md:grid-cols-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                <Input placeholder="Enter policy number" value={formData.policyNumber? formData.policyNumber : ''} disabled/>
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
            className="bg-blue-500 text-white hover:bg-blue-600 flex items-center space-x-2"
            onClick={handleSubmit}
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

export default FinishEmployee;