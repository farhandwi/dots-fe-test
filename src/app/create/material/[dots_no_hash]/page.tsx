'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from 'axios';
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'react-toastify';
import { Search, Loader2, ChevronDown, X } from "lucide-react";
import { Layout } from '@/components/Layout';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import { useAuth } from '@/lib/auth-context';
import Swal from 'sweetalert2';

interface DecodedToken {
    exp: number;
}

interface MaterialItem {
    id: number;
    material_group: string;
    material_group_desc: string;
    material_item: string;
    material_item_desc_en: string;
    material_item_desc_id: string;
    gl_account: string;
    gl_account_desc: string;
    satuan: string;
    type: string;
}

interface AmountState {
    value: number;
    formatted: string;
}

interface FormValues {
    dots_number: string | undefined;
    internal_order: string | undefined;
    shortText: string;
    remarkItem: string;
    unit: string;
    cost_center: string;
    material_group: string;
    order_unit: number | null;
    material_item: string;
    gl: string;
    base_realization: number | null;
    vat_percentage: number | null;
    vat_amount: number | null;
    proposed_amount: number | null;
    realization_amount: number | null;
    different_amount: number | null;
}

interface CostCenterItem {
    cost_center: string;
    cost_center_name: string;
}

interface InternalOrders{
    cost_center: string,
    internal_order: string,
    ref_code: string,
    description: string
}

type MaterialDots = {
    dots_number: string | undefined;
    form_type: string;
    status: string;
    trx_type: string;
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
  
const MaterialDetail = ({ params }: { params: { dots_no_hash: string } }) => {
    const router = useRouter();
    const DotsEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
    const BpmsEndPoint = process.env.NEXT_PUBLIC_BPMS_BE_END_POINT;
    const SapEndPoint = process.env.NEXT_PUBLIC_SAP_END_POINT;
    const { user} = useAuth() as { 
        user: User | null; 
    };

    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isCostCenterPopoverOpen, setIsCostCenterPopoverOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [searchValueCostCenter, setSearchValueCostCenter] = useState("");
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
    const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenterItem | null>(null);
    const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenterItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [internalOrders, setinternalOrders] = useState<InternalOrders[]>([]);
    const [isLoading2, setIsLoading2] = useState(true);
    const [isFetchingMaterials, setIsFetchingMaterials] = useState(false);
    const [isFetchingCostCenter, setIsFetchingCostCenter] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [transaction, setTransaction] = useState<MaterialDots>();
    const [formType, setFormType] = useState<string>('');
    const [currency, setCurrency] = useState<string>('IDR');
    const [baseAmount, setBaseAmount] = useState<AmountState>({ value: 0, formatted: '0' });
    const [proposedAmount, setProposedAmount] = useState<AmountState>({ value: 0, formatted: '0' });
    const [realizationAmount, setRealizationAmount] = useState<AmountState>({ value: 0, formatted: '0' });
    const [differentAmount, setDifferentAmount] = useState<AmountState>({ value: 0, formatted: '0' });
    const [filteredInternalOrders, setFilteredInternalOrders] = useState<InternalOrders[]>([]);
    const [selectedInternalOrder, setSelectedInternalOrder] = useState<string>('');
    const [isInternalOrderPopoverOpen, setIsInternalOrderPopoverOpen] = useState(false);
    const [searchValueInternalOrder, setSearchValueInternalOrder] = useState("");
    const [isTokenLoading, setIsTokenLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [expire, setExpire] = useState<number | null>(null);
    const [role, setRole] = useState<Role[] | null>([]);
    const APIEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;

    function getRolesByApplicationName(
        applications: Application[],
        targetName: string
      ): Role[] | null {
        const app = applications.find((app) => app.app_name === targetName);
        return app ? app.role : null;
    }

    useEffect(() => {
    if (user) {
        const targetName = "DOTS";
        const roleDots: Role[] | null = getRolesByApplicationName(user?.application, targetName) ?? null;
        setRole(roleDots);
    }
    }, [user]);
  
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

    const [vatState, setVatState] = useState({
        enabled: false,
        percentage: null as number | null,
        amount: 0
    });

    const [formValues, setFormValues] = useState<FormValues>({
        shortText: '',
        internal_order: '',
        remarkItem: '',
        unit: '',
        cost_center: '',
        dots_number: '',
        material_group: '',
        order_unit: null,
        gl: '',
        material_item: '',
        base_realization: null,
        vat_percentage: null,
        vat_amount: null,
        proposed_amount: null,
        realization_amount: null,
        different_amount: null
    });

    const formatCurrency = (value: number): string => {
        if (isNaN(value)) return '';
        return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
        }).format(value);
    };

    const cleanNumber = (value: string): number => {
        const cleaned = value.replace(/[^\d.-]/g, '');
        return cleaned ? parseFloat(cleaned) : 0;
    };

    useEffect(() => {
        if (formType === 'Disbursement' || (formType === 'Cash in Advance' && transaction?.trx_type === '2' && transaction.status === '2010')) {
            setRealizationAmount({
                value: baseAmount.value,
                formatted: formatCurrency(baseAmount.value)
            });
        }

        const diffValue = proposedAmount.value - ((vatState.amount || 0) + realizationAmount.value);

        setDifferentAmount({
            value: diffValue,
            formatted: formatCurrency(diffValue)
        });

        // Update formValues with the latest amount values
        setFormValues(prev => ({
            ...prev,
            base_realization: baseAmount.value,
            vat_percentage: vatState.percentage || 0,
            vat_amount: vatState.amount,
            proposed_amount: proposedAmount.value,
            realization_amount: vatState.amount 
                ? vatState.amount + realizationAmount.value
                : realizationAmount.value,
            different_amount: differentAmount.value
        }));
    }, [
        formType, 
        baseAmount.value, 
        proposedAmount.value, 
        realizationAmount.value, 
        vatState.percentage, 
        vatState.amount,
        differentAmount.value
    ]);

    useEffect(() => {
        if (vatState.enabled && vatState.percentage) {
        const vatAmount = baseAmount.value * ((vatState.percentage) / 100);
        setVatState(prev => ({ ...prev, amount: vatAmount }));
        } else {
        setVatState(prev => ({ ...prev, amount: 0 }));
        }
    }, [baseAmount.value, vatState.enabled, vatState.percentage]);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const response = await axiosJWT.get(
                `${DotsEndPoint}/get/transaction-non-insurance/${params.dots_no_hash}`
                );
                
                if (response.status !== 200) throw new Error('Failed to fetch transaction');
                
                const data = response.data;
                setTransaction(data);
                setFormType(data.form_type);
                setCurrency(data.curr_id || 'IDR');
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching transaction:', error);
                router.push('/404');
            }
        };

        if(!isTokenLoading){
            fetchTransaction();
        }

    }, [params.dots_no_hash, router, token, axiosJWT, isTokenLoading]);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const response = await axiosJWT.get(
                `${DotsEndPoint}/internal-order`,
                );
                
                if (response.status !== 200) throw new Error('Failed to fetch transaction');
                
                const data = response.data;
                setinternalOrders(data.data);
                setIsLoading2(false);
            } catch (error) {
                console.error('Error fetching transaction:', error);
                router.push('/404');
            }
        };

        if(!isTokenLoading){
            fetchTransaction();
        }
    }, [params.dots_no_hash, router, token, axiosJWT, isTokenLoading]);

    useEffect(() => {
        const fetchMaterialItems = async () => {
            if (!isPopoverOpen) return;
            
            setIsFetchingMaterials(true);
            try {
                const res = await axiosJWT.get(
                `${DotsEndPoint}/material-gl-mappings/${searchValue ? `?search=${searchValue}` : ''}`,
                );
                
                if (res.status !== 200) throw new Error('Failed to fetch material items');
                
                const response =res.data;
                setMaterialItems(response.data.data);
            } catch (error) {
                console.error('Error fetching material items:', error);
                setMaterialItems([]);
            } finally {
                setIsFetchingMaterials(false);
            }
        };

        if(!isTokenLoading){
            const debounceTimer = setTimeout(fetchMaterialItems, 300);
            return () => clearTimeout(debounceTimer);
        }

    }, [searchValue, isPopoverOpen]);


    useEffect(() => {
        const fetchCostCenter = async () => {
            if (!isCostCenterPopoverOpen) return;
            
            setIsFetchingCostCenter(true);
            try {

                    try {
                        const res = await axios.get(
                            `${BpmsEndPoint}/cost-center${searchValueCostCenter ? `?cost_center_name=${searchValueCostCenter}` : ''}`
                        );
                        
                        if (res.status === 200) {
                            setCostCenters(res.data || []);
                        } else {
                            setCostCenters([]);
                        }
                    } catch (error) {
                        console.error('Error fetching all cost centers:', error);
                        setCostCenters([]);
                    }
                
            } catch (error) {
                console.error('Error in cost center fetch process:', error);
                setCostCenters([]);
            } finally {
                setIsFetchingCostCenter(false);
            }
        };
    
        if (!isTokenLoading) {
            const debounceTimer = setTimeout(fetchCostCenter, 300);
            return () => clearTimeout(debounceTimer);
        }
    }, [isCostCenterPopoverOpen, role, searchValueCostCenter]);

    useEffect(() => {
        if (selectedCostCenter) {
            const filtered = internalOrders.filter(
                order => order.cost_center === selectedCostCenter.cost_center
            );
            setFilteredInternalOrders(filtered);
            setSelectedInternalOrder('');
        } else {
            setFilteredInternalOrders([]);
        }
    }, [selectedCostCenter, internalOrders]);

    const handleInternalOrderSelect = (internalOrder: InternalOrders) => {
        setSelectedInternalOrder(internalOrder.internal_order);
        setIsInternalOrderPopoverOpen(false);
        setFormValues(prev => ({
            ...prev,
            internal_order: internalOrder.internal_order
        }));
    };

    const handleClearInternalOrder = () => {
        setSelectedInternalOrder('');
        setFormValues(prev => ({
          ...prev,
          internal_order: ''
        }));
    };

    const handleAmountFocus = (
        amount: AmountState,
        setter: React.Dispatch<React.SetStateAction<AmountState>>
    ) => {
        setter({
        ...amount,
        formatted: amount.value.toString()
        });
    };

    const handleAmountBlur = (
        amount: AmountState,
        setter: React.Dispatch<React.SetStateAction<AmountState>>
    ) => {
        setter({
        ...amount,
        formatted: formatCurrency(amount.value)
        });
    };

    const handleVatEnabledChange = (checked: boolean) => {
        setVatState(prev => ({
        ...prev,
        enabled: checked,
        percentage: checked ? prev.percentage : null,
        amount: 0
        }));
    };

    const handleMaterialSelect = (material: MaterialItem) => {
        setSelectedMaterial(material);
        setIsPopoverOpen(false);
        setFormValues(prev => ({
        ...prev,
            dots_number: transaction?.dots_number,
            material_group: material.material_group,
            material_item: material.material_item,
            gl: material.gl_account,
            shortText: `${material.material_item_desc_en} (${material.material_item})`,
            unit: material.satuan || '',
        }));
    };

    const handleCostCenterSelect = (costCenter: CostCenterItem) => {
        setSelectedCostCenter(costCenter);
        setIsCostCenterPopoverOpen(false);
        setFormValues(prev => ({
            ...prev,
            cost_center: costCenter.cost_center || '',
        }));
    };

    const handleVatPercentageSelect = (value: number) => {
        setVatState(prev => ({
            ...prev,
            percentage: value,
            amount: prev.enabled ? baseAmount.value * ((value) / 100) : 0
        }));

        setFormValues(prev => ({
            ...prev,
            vat_percentage: value
        }));
    };

    const handleOrderUnitChange = (value: number) => {
        setFormValues(prev => ({ 
            ...prev, 
            order_unit: value
        }));
    };

    const handleAmountChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<AmountState>>,
        field: 'base' | 'proposed'
    ) => {
        const value = event.target.value;
        const numericValue = cleanNumber(value);
        
        setter({
            value: numericValue,
            formatted: value
        });

        if (field === 'base') {
            setFormValues(prev => ({
                ...prev,
                base_realization: numericValue
            }));
        } else if (field === 'proposed') {
            setFormValues(prev => ({
                ...prev,
                proposed_amount: numericValue
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let requiredFields: (keyof FormValues)[] = [];
    
            requiredFields = [
                'gl', 'shortText', 'different_amount', 'remarkItem', 'material_group', 'material_item', 'cost_center'
            ];

            if(transaction?.form_type === 'Disbusement'){
                requiredFields.push('base_realization');
                requiredFields.push('realization_amount');
            }else if(transaction?.form_type === 'Cash in Advance'){
                if((transaction.status === '2010' && transaction.trx_type === '2')){
                    requiredFields.push('base_realization');
                    requiredFields.push('realization_amount');
                }else{
                    requiredFields.push('proposed_amount');
                }
            }
            
            const missingFields = requiredFields.filter(field => !formValues[field]);
            
            if (missingFields.length > 0) {
                toast.error(
                    `Please fill in the following fields: ${missingFields.join(', ')}`
                );
                setIsSubmitting(false);
                return;
            }
            const requestBody = {
                BUKRS: 'TUGU',
                dots_number: formValues.dots_number,
                cost_center: formValues.cost_center,
                internal_order: formValues.internal_order,
                material_group: formValues.material_group,
                material_item: formValues.material_item,
                gl: formValues.gl,
                short_text: formValues.shortText,
                order_unit: formValues.order_unit,
                remark_item: formValues.remarkItem,
                proposed_amt: formValues.proposed_amount,
                diff_amt: formValues.different_amount,
                base_realization_amt: formValues.base_realization,
                vat_indicator: vatState.enabled,
                tax_code: vatState.percentage === 1.2 ? 'V1' : vatState.percentage === 12 ? 'V0' : null,
                vat_pct: vatState.percentage,
                vat_amt: vatState.amount,
                realization_amt: formValues.realization_amount,
                acc_assignment: null,
                asset: null
            };

            await axiosJWT.post(
                `${DotsEndPoint}/material-detil`, 
                requestBody
            );

            toast.success('Material details successfully created!');
            router.push(`/detail/${params.dots_no_hash}`);

        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    const errorDesc = error.response.data.error_desc;
                    
                    if (typeof errorDesc === 'object') {
                        const errorMessages = Object.values(errorDesc)
                            .flat()
                            .join('\n');
                        
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: errorMessages,
                            customClass: {
                                container: 'swal-pre-wrap'
                            }
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: errorDesc || 'Failed to create detailed material'
                        });
                    }
                } else if (error.request) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Network Error',
                        text: 'No response from server'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'An error occurred in processing the transaction'
                    });
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && isLoading2) {
        return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading transaction data...</span>
        </div>
        );
    }

    return (
        <Layout>
            <div className="flex container mx-auto px-0 py-0 md:py-8 max-w-full justify-center bg-gray-50">
                <Card className="shadow-lg md:mx-0 md:w-3/4 w-full">
                <CardHeader className="border-b">
                    <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-gray-800">Material Detail</CardTitle>
                    <p className="text-sm text-gray-500">Create</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Transaction Info */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                            <Label htmlFor="downPaymentNo">Down Payment No <span className="text-red-500 relative group">
                                *
                                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                    Required
                                </div>
                            </span></Label>
                            <Input
                                id="downPaymentNo"
                                value={transaction?.dots_number}
                                className="bg-gray-50"
                                disabled
                                required
                            />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="type">Type  <span className="text-red-500 relative group">
                                *
                                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                    Required
                                </div>
                            </span></Label>
                            <Input
                                id="type"
                                value={transaction?.form_type}
                                className="bg-gray-50"
                                disabled
                                required
                            />
                            </div>
                        </div>

                        {/* Cost Center */}
                        <div className="space-y-2">
                            <Label htmlFor="materialItem">Cost Center <span className="text-red-500 relative group">
                                *
                                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                    Required
                                </div>
                            </span></Label>
                            <Popover open={isCostCenterPopoverOpen} onOpenChange={setIsCostCenterPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isCostCenterPopoverOpen}
                                className="w-full justify-between"
                                >
                                <span className="truncate max-w-full block overflow-hidden text-ellipsis whitespace-nowrap">
                                    {selectedCostCenter
                                        ? `${selectedCostCenter.cost_center} - ${selectedCostCenter.cost_center_name}`
                                        : "Select cost center..."}
                                </span>
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Search cost center..."
                                    value={searchValueCostCenter}
                                    onValueChange={setSearchValueCostCenter}
                                    className="h-9"
                                    required
                                />
                                <CommandList>
                                    {isFetchingCostCenter ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="ml-2">Loading cost center...</span>
                                    </div>
                                    ) : (
                                    <>
                                        {costCenters.length === 0 ? (
                                        <CommandEmpty>No cost center found.</CommandEmpty>
                                        ) : (
                                        <CommandGroup>
                                            {costCenters.map((cost_center) => (
                                            <CommandItem
                                                key={cost_center.cost_center}
                                                onSelect={() => handleCostCenterSelect(cost_center)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex-1 min-w-0">
                                                <span className="font-medium block truncate">
                                                    {cost_center.cost_center}
                                                </span>
                                                <span className="text-gray-600 block truncate">
                                                    {cost_center.cost_center_name}
                                                </span>
                                                </div>
                                            </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        )}
                                    </>
                                    )}
                                </CommandList>
                                </Command>
                            </PopoverContent>
                            </Popover>
                        </div>

                        {/* select internal order */}
                        {selectedCostCenter && filteredInternalOrders.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="internalOrder">Internal Order</Label>
                            <div className="flex items-center gap-2">
                            <Popover 
                                open={isInternalOrderPopoverOpen} 
                                onOpenChange={setIsInternalOrderPopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isInternalOrderPopoverOpen}
                                    className="w-full justify-between relative group"
                                >
                                    <span className="truncate max-w-[90%] block overflow-hidden text-ellipsis whitespace-nowrap">
                                    {selectedInternalOrder || "Select internal order..."}
                                    </span>
                                    <Search className="h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                    placeholder="Search internal order..."
                                    value={searchValueInternalOrder}
                                    onValueChange={setSearchValueInternalOrder}
                                    className="h-9"
                                    />
                                    <CommandList>
                                    <CommandGroup>
                                        {filteredInternalOrders
                                        .filter(order => 
                                            order.internal_order.toLowerCase().includes(searchValueInternalOrder.toLowerCase()) ||
                                            order.description.toLowerCase().includes(searchValueInternalOrder.toLowerCase())
                                        )
                                        .map((order) => (
                                            <CommandItem
                                            key={order.internal_order}
                                            onSelect={() => handleInternalOrderSelect(order)}
                                            className="cursor-pointer"
                                            >
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium block truncate">
                                                {order.internal_order}
                                                </span>
                                                <span className="text-gray-600 block truncate">
                                                {order.description}
                                                </span>
                                            </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                            {selectedInternalOrder && (
                                <Button
                                type="button"
                                variant="ghost"
                                className="px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={handleClearInternalOrder}
                                >
                                <X className="h-4 w-4" />
                                </Button>
                            )}
                            </div>
                        </div>
                        )}

                        {/* Material Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="materialItem">Material Item (Expenses Item) <span className="text-red-500 relative group">
                                *
                                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                    Required
                                </div>
                            </span></Label>
                            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isPopoverOpen}
                                    className="w-full justify-between"
                                >
                                <span className="truncate max-w-full block overflow-hidden text-ellipsis whitespace-nowrap">
                                    {selectedMaterial
                                        ? `${selectedMaterial.material_item} - ${selectedMaterial.material_item_desc_en}`
                                        : "Select material item..."}
                                </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Search material..."
                                    value={searchValue}
                                    onValueChange={setSearchValue}
                                    className="h-9"
                                    required
                                />
                                <CommandList>
                                    {isFetchingMaterials ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="ml-2">Loading materials...</span>
                                    </div>
                                    ) : (
                                    <>
                                        {materialItems.length === 0 ? (
                                        <CommandEmpty>No material found.</CommandEmpty>
                                        ) : (
                                        <CommandGroup>
                                            {materialItems.map((material) => (
                                            <CommandItem
                                                key={material.id}
                                                onSelect={() => handleMaterialSelect(material)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex-1 min-w-0">
                                                <span className="font-medium block truncate">
                                                    {material.material_item_desc_en}({material.material_item})
                                                </span>
                                                <span className="text-gray-600 block truncate">
                                                    {material.material_group_desc}({material.material_group})
                                                </span>
                                                <span className="text-gray-600 block truncate">
                                                    {material.gl_account_desc}({material.gl_account})
                                                </span>
                                                </div>
                                            </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        )}
                                    </>
                                    )}
                                </CommandList>
                                </Command>
                            </PopoverContent>
                            </Popover>
                        </div>


                        {/* Material Group */}
                        <div className="space-y-2">
                            <Label htmlFor="materialGroup">Material Group <span className="text-red-500 relative group">
                                *
                                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                    Required
                                </div>
                            </span></Label>
                            <Input
                            id="materialGroup"
                            className="bg-gray-100"
                            disabled
                            value={selectedMaterial?.material_group_desc || ''}
                            required
                            />
                        </div>

                        {/* General Ledger */}
                        <div className="space-y-2">
                            <Label htmlFor="generalLedger">General Ledger <span className="text-red-500 relative group">
                                *
                                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                    Required
                                </div>
                            </span></Label>
                            <Input
                            id="generalLedger"
                            className="bg-gray-100"
                            disabled
                            value={selectedMaterial?.gl_account ? 
                                `${selectedMaterial.gl_account_desc} (${selectedMaterial.gl_account})` : 
                                ''}
                            required
                            />
                        </div>

                        {/* Text Areas */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                            <Label htmlFor="shortText">Short Text <span className="text-red-500 relative group">
                                *
                                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                    Required
                                </div>
                            </span></Label>
                            <Textarea
                                id="shortText"
                                className="min-h-[120px] bg-gray-100"
                                value={selectedMaterial?.material_item_desc_en ? 
                                `${selectedMaterial.material_item_desc_en} (${selectedMaterial.material_item})` :
                                ''}
                                disabled
                                required
                            />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="remarkItem">Remark Item <span className="text-red-500 relative group">
                                *
                                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                    Required
                                </div>
                            </span></Label>
                            <Textarea
                                id="remarkItem"
                                className="min-h-[120px]"
                                value={formValues.remarkItem}
                                onChange={(e) => setFormValues(prev => ({ ...prev, remarkItem: e.target.value }))}
                                required
                            />
                            </div>
                        </div>

                        {/* Order Unit and Unit */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="orderUnit">Order Unit <span className="text-red-500 relative group">
                                    *
                                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                        Required
                                    </div>
                                </span></Label>
                                <Input
                                    id="orderUnit"
                                    type="number"
                                    value={`${formValues.order_unit}`}
                                    onChange={(e) => handleOrderUnitChange(parseInt(e.target.value) || 1)}
                                    min="1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Input
                                id="unit"
                                value={formValues.unit}
                                className="bg-gray-100"
                                disabled
                                />
                            </div>
                            </div>
                        </div>

                        {/* Amount Fields */}
                        <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="baseAmount">
                            Base Realization Amount <span className="text-red-500 relative group">
                                *
                                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                Required
                                </div>
                            </span>
                            </Label>
                            <Input
                                id="baseAmount"
                                value={baseAmount.formatted}
                                onChange={(e) => handleAmountChange(e, setBaseAmount, 'base')}
                                onFocus={() => handleAmountFocus(baseAmount, setBaseAmount)}
                                onBlur={() => handleAmountBlur(baseAmount, setBaseAmount)}
                                disabled={formType === 'Cash in Advance' && !(transaction?.status === '2010' && transaction.trx_type === '2')}
                                required={!(formType === 'Cash in Advance' && !(transaction?.status === '2010' && transaction.trx_type === '2'))}
                                className={`${(formType === 'Cash in Advance' && !(transaction?.status === '2010' && transaction.trx_type === '2')) ? 'bg-gray-50' : 'bg-white'}`}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                            <Label htmlFor="vatPercentage">
                                VAT Percentage
                            </Label>
                            <Checkbox 
                                id="vatEnabled"
                                checked={vatState.enabled}
                                onCheckedChange={handleVatEnabledChange}
                                className="mr-2"
                                disabled={formType === 'Cash in Advance' && !(transaction?.status === '2010' && transaction.trx_type === '2')}
                            />
                            </div>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={!vatState.enabled || formType === 'Cash in Advance' && !(transaction?.status === '2010' && transaction.trx_type === '2')}>
                                <Button 
                                variant="outline" 
                                className="w-full justify-between"
                                >
                                <span>
                                    {vatState.percentage ? `${vatState.percentage}%` : 'Select VAT Percentage'}
                                </span>
                                <ChevronDown className="w-4 h-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
                                <DropdownMenuItem 
                                onClick={() => handleVatPercentageSelect(1.2)}
                                className="justify-between"
                                >
                                    1.2%
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                onClick={() => handleVatPercentageSelect(12)}
                                className="justify-between"
                                >
                                    12%
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="vatAmount">VAT Amount</Label>
                            <Input
                            id="vatAmount"
                            value={formatCurrency(vatState.amount)}
                            className="bg-gray-50"
                            disabled
                            />
                        </div>
                        </div>

                        {/* Final Amounts */}
                        <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="proposedAmount">
                            Proposed Amount <span className="text-red-500 relative group">
                                *
                                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                                Required
                                </div>
                            </span>
                            </Label>
                            <Input
                            id="proposedAmount"
                            value={proposedAmount.formatted}
                            onChange={(e) => handleAmountChange(e, setProposedAmount, 'proposed')}
                            onFocus={() => handleAmountFocus(proposedAmount, setProposedAmount)}
                            onBlur={() => handleAmountBlur(proposedAmount, setProposedAmount)}
                            disabled={formType === 'Disbursement' || (transaction?.status === '2010' && transaction.trx_type === '2' && formType === 'Cash in Advance')}
                            required={formType === 'Disbursement'}
                            className={`${formType === 'Disbursement' ? 'bg-gray-100' : ''}`}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="realizationAmount">Total (Realization Amount)</Label>
                            <Input
                            id="realizationAmount"
                            value={vatState.amount? formatCurrency(vatState.amount+realizationAmount.value) : realizationAmount.formatted}
                            className="bg-gray-50"
                            disabled
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="differentAmount">Different Amount</Label>
                            <Input
                            id="differentAmount"
                            value={differentAmount.formatted}
                            className="bg-gray-50"
                            disabled
                            />
                        </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-end pt-10">
                            <Button type='button' variant="destructive" onClick={() => router.back()}>
                                Back
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-blue-500 hover:bg-blue-600"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create'
                                )}
                            </Button> 
                        </div>
                    </form>
                </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default MaterialDetail;