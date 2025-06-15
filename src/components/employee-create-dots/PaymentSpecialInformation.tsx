import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, ArrowRight, Check, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useEffect } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { FormData } from '@/types/newDots';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useAxiosJWT } from '@/hooks/useAxiosJwt';
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
import { cn } from '@/lib/utils';

interface CardData {
    card_no: string;
    bp: string;
    cardholder_name: string;
    bank_name: string;
    category: string;
    valid_from: string;
    valid_to: string | null;
}

interface DecodedToken {
    exp: number;
}

interface Props {
    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>;
    currentStep: number;
    setCurrentStep: (value: number) => void;
    handleBack: (type: string) => void;
}

const CardPaymentInformation: React.FC<Props> = ({
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    handleBack
}) => {
    const DotsEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
    const BpmsEndpoint = process.env.NEXT_PUBLIC_BPMS_BE_END_POINT;
    const [cardData, setCardData] = useState<CardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentDetails, setPaymentDetails] = useState(formData.paymentRemark || '');

    const calculateDefaultDueDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
    };

    const [isTokenLoading, setIsTokenLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [expire, setExpire] = useState<number | null>(null);
    const APIEndpoint = `${process.env.NEXT_PUBLIC_DOTS_BE_END_POINT}`;
  
    useEffect(() => {
        let isMounted = true;
        const refreshToken = async () => {
            if (token && expire && expire > Date.now() / 1000) {
                setIsTokenLoading(false);
                return;
            }
    
            try {
                const response = await axios.get(`${BpmsEndpoint}/token`, { 
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
        const fetchCardData = async () => { 
            if(!formData.businessPartner) return           
            setLoading(true);
            try {
                let response = null;
                if(formData.category === 'Cash Card'){
                    response = await axiosJWT.get(`${DotsEndPoint}/cash-cards/bp/${formData.businessPartner}/${formData.category}/${formData.costCenter}`);
                }else if(formData.category === 'Corporate Card'){
                    response = await axiosJWT.get( `${DotsEndPoint}/cash-cards/bp/${formData.businessPartner}/${formData.category}/null`);
                }
                const data = response?.data;
                setCardData(data);
                
                if (data && data.length > 0) {
                    const firstCard = data[0];
                    setFormData(prev => ({
                        ...prev,
                        currency: 'IDR',
                        paymentRemark: '',
                        paymentType: 'Block for payment',
                        estimatePaymentDueDate: calculateDefaultDueDate(),
                        bankAccountNo: firstCard.card_no,
                        bankName: firstCard.bank_name,
                        accountName: firstCard.cardholder_name
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch card data:', error);
            } finally {
                setLoading(false);
            }
        };
        if (!isTokenLoading) {
            fetchCardData();
        }

    }, [formData.businessPartner, token, axiosJWT, isTokenLoading]);

    const handleBankAccountChange = (value: string) => {
        const selectedCard = cardData.find(card => card.card_no === value);
        if (selectedCard) {
            setFormData(prev => ({
                ...prev,
                currency: 'IDR',
                paymentRemark: '',
                paymentType: 'Block for payment',
                estimatePaymentDueDate: calculateDefaultDueDate(),
                bankAccountNo: value,
                bankName: selectedCard.bank_name,
                accountName: selectedCard.cardholder_name
            }));
            setOpen(false);
        }
    };

    const handlePaymentDetailChange = (value: string) => {
        setPaymentDetails(value);
        setFormData(prev => ({
            ...prev,
            paymentRemark: value
        }));
    };

    const isRequiredFieldsFilled = (): boolean => {
        return !!(
            formData.currency &&
            formData.paymentType &&
            formData.estimatePaymentDueDate &&
            formData.bankAccountNo &&
            formData.bankName &&
            formData.accountName
        );
    };

    const handleNextStep = () => {
        if (isRequiredFieldsFilled()) {
            setCurrentStep(currentStep + 1);
        }
    };

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
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Currency Selection - Fixed to IDR */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Currency <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                value="IDR - Indonesian Rupiah" 
                                disabled 
                                className="bg-gray-100"
                            />
                        </div>

                        {/* Payment Type - Fixed to Block for payment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Type <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                value="Block for payment" 
                                disabled 
                                className="bg-gray-100"
                            />
                        </div>

                        {/* Due Date - Fixed to a week from today */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="date"
                                value={calculateDefaultDueDate()}
                                disabled
                                className="w-full cursor-not-allowed bg-gray-100"
                            />
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Details
                        </label>
                        <Textarea 
                            placeholder="Enter payment details or special instructions"
                            className="min-h-32"
                            value={paymentDetails}
                            onChange={(e) => handlePaymentDetailChange(e.target.value)}
                        />
                    </div>

                    {/* Bank Details Section */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Bank Account */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Account <span className="text-red-500">*</span>
                            </label>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between"
                                    >
                                        {formData.bankAccountNo
                                            ? cardData.find((card) => card.card_no === formData.bankAccountNo)?.card_no
                                            : "Select bank account..."}
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search bank account..." className="h-9" />
                                        <CommandList>
                                            <CommandEmpty>No bank account found.</CommandEmpty>
                                            <CommandGroup>
                                                {cardData.map((card) => (
                                                    <CommandItem
                                                        key={card.card_no}
                                                        value={card.card_no}
                                                        onSelect={handleBankAccountChange}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.bankAccountNo === card.card_no 
                                                                    ? "opacity-100" 
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {card.card_no}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        
                        {/* Bank Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Name <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                value={formData.bankName || ''} 
                                disabled 
                                className="bg-gray-100"
                            />
                        </div>
                        
                        {/* Account Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Name <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                value={formData.accountName || ''} 
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
};

export default CardPaymentInformation;