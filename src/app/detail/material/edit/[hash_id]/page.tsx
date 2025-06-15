'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'react-toastify';
import { Search, Loader2, ChevronDown, X } from "lucide-react";
import { Layout } from '@/components/Layout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { jwtDecode } from 'jwt-decode';
import { useAxiosJWT } from '@/hooks/useAxiosJwt';
import axios from 'axios';
import AccessDenied from '@/components/error/access-denied/page';
import Swal from 'sweetalert2';

interface DecodedToken {
  exp: number;
}

type FieldValues = {
  [key: string]: string | number | undefined;
  gl: string | undefined;
  shortText: string;
  different_amount: number;
  remarkItem: string;
  material_group: string | undefined;
  material_item: string | undefined;
  cost_center: string | undefined;
  base_realization: number;
  realization_amount: number;
  proposed_amount: number;
};

interface AmountState {
  value: number;
  formatted: string;
}

interface MaterialDetailData {
  dots_number: string;
  BUKRS: string;
  cost_center: string;
  item_number: string;
  internal_order: string;
  hash_id: string;
  short_text: string;
  order_unit: number;
  remark_item: string;
  proposed_amt: number;
  base_realization_amt: number;
  vat_indicator: boolean;
  tax_code: string | null;
  vat_pct: number | null;
  vat_amt: number;
  realization_amt: number;
  diff_amt: number;
  acc_assignment: string | null;
  asset: string | null;
  material_group: string;
  gl: string;
  material_item: string;
  unit: string;
  form_type: string;
  curr_id: string;
}

interface CostCenterItem {
  cost_center: string;
  cost_center_name: string;
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

interface InternalOrders{
  cost_center: string,
  internal_order: string,
  ref_code: string,
}

const EditMaterialDetail = ({ params }: { params: { hash_id: string } }) => {
  const router = useRouter();
  const DotsEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const BpmsEndPoint = process.env.NEXT_PUBLIC_BPMS_BE_END_POINT;
  const SapEndPoint = process.env.NEXT_PUBLIC_SAP_END_POINT;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materialDetail, setMaterialDetail] = useState<MaterialDetailData | null>(null);
  const [materialDesc, setMaterialDesc] = useState<string>('');
  const [costCenterDesc, setCostCenterDesc] = useState<string>('');
  const [currency, setCurrency] = useState<string>('IDR');
  const [formType, setFormType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [transactionType, setTransactionType] = useState<string>('');
  const hash_id = params.hash_id;

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isCostCenterPopoverOpen, setIsCostCenterPopoverOpen] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenterItem | null>(null);
  const [searchValueCostCenter, setSearchValueCostCenter] = useState("");
  const [costCenters, setCostCenters] = useState<CostCenterItem[]>([]);
  const [isFetchingCostCenter, setIsFetchingCostCenter] = useState(false);


  const [isFetchingMaterials, setIsFetchingMaterials] = useState(false);
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const [isTokenLoading, setIsTokenLoading] = useState(true);

  const [isLoading2, setIsLoading2] = useState(true);

  const [filteredInternalOrders, setFilteredInternalOrders] = useState<InternalOrders[]>([]);
  const [selectedInternalOrder, setSelectedInternalOrder] = useState<string>('');
  const [isInternalOrderPopoverOpen, setIsInternalOrderPopoverOpen] = useState(false);
  const [searchValueInternalOrder, setSearchValueInternalOrder] = useState("");
  const [internalOrders, setinternalOrders] = useState<InternalOrders[]>([]);
  
  // States for amounts
  const [baseAmount, setBaseAmount] = useState<AmountState>({ value: 0, formatted: '0' });
  const [proposedAmount, setProposedAmount] = useState<AmountState>({ value: 0, formatted: '0' });
  const [realizationAmount, setRealizationAmount] = useState<AmountState>({ value: 0, formatted: '0' });
  const [differentAmount, setDifferentAmount] = useState<AmountState>({ value: 0, formatted: '0' });

  const [vatState, setVatState] = useState({
    enabled: false,
    percentage: null as number | null,
    amount: 0
  });

  const [token, setToken] = useState<string | null>(null);
  const [expire, setExpire] = useState<number | null>(null);
  const APIEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;

  const [formValues, setFormValues] = useState<MaterialDetailData>({
    dots_number: '',
    BUKRS: '',
    cost_center: '',
    item_number: '',
    internal_order: '',
    hash_id: '',
    short_text: '',
    order_unit: 1,
    remark_item: '',
    proposed_amt: 0,
    base_realization_amt: 0,
    vat_indicator: false,
    tax_code: null,
    vat_pct: null,
    vat_amt: 0,
    realization_amt: 0,
    diff_amt: 0,
    acc_assignment: null,
    asset: null,
    material_group: '',
    gl: '',
    material_item: '',
    unit: '',
    form_type: '',
    curr_id: '',
  });  

  const axiosJWT = useAxiosJWT({
    token,
    expire,
    setToken,
    setExpire,
    APIEndpoint
  });

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

  useEffect(() => {
    const fetchMaterialDetail = async () => {
      if (!token) return;
      
      try {
        const response = await axiosJWT.get(
          `${DotsEndPoint}/material-detil/get-one/${hash_id}`
        );

        if (response.status === 200) {
          const data = response.data.data;
          const getDots = await axiosJWT.get(`${DotsEndPoint}/get-one/transaction-non-insurance/${data.dots_number}`);
          const dataCostCenter = await axios.get(`${BpmsEndPoint}/cost-center?cost_center=${data.cost_center}`);
          
          setCostCenterDesc(dataCostCenter.data[0]?.cost_center_name || '');
          setMaterialDetail(data);
          setCurrency(data.curr_id || 'IDR');
          setFormType(getDots.data.form_type || '');
          setTransactionType(getDots.data.trx_type || '');
          setStatus(getDots.data.status || '');

          if (getDots.status === 200) {
            const getUnit = await axios.get(`${SapEndPoint}/MD/Material?matnr=${data.material_item}`);
            setMaterialDesc(getUnit.data.data_result[0]?.WGBEZ || '');
            
            setFormValues(prev => ({
              ...prev,
              internal_order: data.internal_order || '',
              short_text: data.short_text || '',
              order_unit: data.order_unit || 1,
              remark_item: data.remark_item || '',
              unit: getUnit.data.data_result[0]?.meins || '',
              material_item: data.material_item || '',
              material_group: data.material_group || '',
              gl: data.gl || '',
              cost_center: data.cost_center || ''
            }));
          }

          setBaseAmount({
            value: data.base_realization_amt || 0,
            formatted: formatCurrency(data.base_realization_amt || 0)
          });

          setProposedAmount({
            value: data.proposed_amt || 0,
            formatted: formatCurrency(data.proposed_amt || 0)
          });

          setVatState({
            enabled: data.vat_indicator || false,
            percentage: data.vat_pct,
            amount: data.vat_amt || 0
          });

          setRealizationAmount({
            value: data.realization_amt || 0,
            formatted: formatCurrency(data.realization_amt || 0)
          });

          setDifferentAmount({
            value: data.diff_amt || 0,
            formatted: formatCurrency(data.diff_amt || 0)
          });
        }
      } catch (error) {
        console.error('Error fetching material detail:', error);
        toast.error('Failed to fetch material detail');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isTokenLoading) {
      fetchMaterialDetail();
    }
  }, [token, hash_id, isTokenLoading]);

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
    if ( materialDetail) {
        const filtered = internalOrders.filter(
            order => order.cost_center === materialDetail?.cost_center
        );
        setFilteredInternalOrders(filtered);
        setSelectedInternalOrder('');
    } else {
        setFilteredInternalOrders([]);
    }
}, [internalOrders, materialDetail]);

  useEffect(() => {
    const fetchCostCenter = async () => {
    if (!isCostCenterPopoverOpen || isTokenLoading) return;

    setIsFetchingCostCenter(true);
    try {
        const res = await axios.get(
            `${BpmsEndPoint}/cost-center${searchValueCostCenter ? `?cost_center_name=${searchValueCostCenter}` : ''}`,
        );
        
        if (res.status !== 200) throw new Error('Failed to fetch material items');
        
        const response = res.data;
        setCostCenters(response);
    } catch (error) {
        console.error('Error fetching material items:', error);
        setCostCenters([]);
    } finally {
        setIsFetchingCostCenter(false);
    }
    };

    if(!isTokenLoading){
        const debounceTimer = setTimeout(fetchCostCenter, 300);
        return () => clearTimeout(debounceTimer);
    }

  }, [searchValueCostCenter, isCostCenterPopoverOpen, token, isTokenLoading]);

  useEffect(() => {
    if (formType === 'Disbursement' && (status === '2010' && transactionType === '2')) {
        setRealizationAmount({
            value: baseAmount.value,
            formatted: formatCurrency(Number(baseAmount.value))
        });
    }

    const diffValue = Number(proposedAmount.value) - (Number(vatState.amount || 0) + Number(realizationAmount.value));

    setDifferentAmount({
        value: diffValue,
        formatted: formatCurrency(Number(diffValue))
    });

    // Update formValues with the latest amount values
    setFormValues(prev => ({
        ...prev,
        base_realization_amt: baseAmount.value,
        vat_pct: vatState.percentage || 0,
        vat_amt: vatState.amount,
        proposed_amt: proposedAmount.value,
        realization_amt: vatState.amount 
            ? (Number(vatState.amount) + Number(realizationAmount.value))
            : realizationAmount.value,
        diff_amt: differentAmount.value
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
  }, [hash_id, router, token, axiosJWT, isTokenLoading]);

  // Format and handling functions
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

  // Amount handling functions
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

  const handleAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<AmountState>>,
    field: 'base' | 'proposed' | 'realization'
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
          base_realization_amt: numericValue
      }));
    } else if (field === 'proposed') {
        setFormValues(prev => ({
            ...prev,
            proposed_amt: numericValue
        }));
    }else if(field === 'realization'){
      setFormValues(prev => ({
        ...prev,
        realization_amt: numericValue
    }));
    }
  };

  const handleClearInternalOrder = () => {
      setSelectedInternalOrder('');
      setFormValues(prev => ({
        ...prev,
        internal_order: ''
      }));
  };

  // VAT handling
  const handleVatEnabledChange = (checked: boolean) => {
    setVatState(prev => ({
      ...prev,
      enabled: checked,
      percentage: checked ? prev.percentage : null,
      amount: 0
    }));
  };

  const handleVatPercentageSelect = (value: number) => {
    setVatState(prev => ({
      ...prev,
      percentage: value,
      amount: prev.enabled ? baseAmount.value * (value / 100) : 0
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Define required fields based on form type
      const requiredFields = [
        'gl', 'shortText', 'different_amount', 'remarkItem', 'material_group', 'material_item', 'cost_center'
      ];
      
      if (formType === 'Disbusement') {
        requiredFields.push('base_realization');
        requiredFields.push('realization_amount');
      } else if (formType === 'Cash in Advance') {
        if((status === '2010' && transactionType === '2')){
          requiredFields.push('base_realization');
          requiredFields.push('realization_amount');
        }else{
          requiredFields.push('proposed_amount');
        }
      }

      const fieldValues: FieldValues = {
        gl: selectedMaterial?.gl_account || materialDetail?.gl,
        shortText: formValues.short_text,
        different_amount: differentAmount.value,
        remarkItem: formValues.remark_item,
        material_group: selectedMaterial?.material_group || materialDetail?.material_group,
        material_item: selectedMaterial?.material_item || materialDetail?.material_item,
        cost_center: selectedCostCenter?.cost_center || materialDetail?.cost_center,
        base_realization: baseAmount.value,
        realization_amount: realizationAmount.value,
        proposed_amount: proposedAmount.value
      };

      const missingFields = requiredFields.filter(field => {
        const value = fieldValues[field];
        return value === undefined || value === '' || value === null;
      });
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return;
      }

      if (materialDetail && (
        materialDetail.material_item !== selectedMaterial?.material_item ||
        materialDetail.material_group !== selectedMaterial?.material_group ||
        materialDetail.gl !== selectedMaterial?.gl_account ||
        materialDetail.cost_center !== selectedCostCenter?.cost_center
      ) && (selectedMaterial || selectedCostCenter)) {

        const requestBody = {
          BUKRS: 'TUGU',
          dots_number: materialDetail.dots_number,
          cost_center: selectedCostCenter?.cost_center ? selectedCostCenter.cost_center : materialDetail.cost_center,
          internal_order: formValues.internal_order,
          material_group: selectedMaterial?.material_group ? selectedMaterial.material_group : materialDetail.material_group,
          material_item: selectedMaterial?.material_item ? selectedMaterial.material_item : materialDetail.material_item,
          gl: selectedMaterial?.gl_account ? selectedMaterial.gl_account : materialDetail.gl,
          short_text: selectedMaterial?.material_item_desc_en ? `${selectedMaterial.material_item_desc_en} (${selectedMaterial.material_item})` :
          materialDetail?.short_text,
          order_unit: formValues.order_unit,
          remark_item: formValues.remark_item,
          proposed_amt: proposedAmount.value,
          diff_amt: differentAmount.value,
          base_realization_amt: baseAmount.value,
          vat_indicator: vatState.enabled,
          tax_code: vatState.percentage === 1.2 ? 'V1' : vatState.percentage === 12 ? 'V0' : null,
          vat_pct: vatState.percentage,
          vat_amt: vatState.amount,
          realization_amt: vatState.amount ? (Number(vatState.amount)+Number(realizationAmount.value)) : Number(realizationAmount.value),
          acc_assignment: null,
          asset: null
        };
        
        const dataMaterialNew = await axiosJWT.post(`${DotsEndPoint}/material-detil`, requestBody);
        
        if(dataMaterialNew.status === 201){
          console.log("deleted successfully");
          const dataDelete = await axiosJWT.delete(
            `${DotsEndPoint}/material-detil/${hash_id}`
          );
        }
      }else{
        const requestBody = {
          internal_order: formValues.internal_order,
          short_text: formValues.short_text,
          order_unit: formValues.order_unit,
          remark_item: formValues.remark_item,
          proposed_amt: proposedAmount.value,
          base_realization_amt: baseAmount.value,
          vat_indicator: vatState.enabled,
          tax_code: vatState.percentage === 1.2 ? 'V1' : vatState.percentage === 12 ? 'V0' : null,
          vat_pct: vatState.percentage,
          vat_amt: vatState.amount,
          realization_amt: vatState.amount ? (Number(vatState.amount)+Number(realizationAmount.value)) : Number(realizationAmount.value),
          diff_amt: differentAmount.value,
          acc_assignment: null,
          asset: "null"
        };
  
        await axiosJWT.put(
          `${DotsEndPoint}/material-detil/${materialDetail?.dots_number}/${materialDetail?.cost_center}/${materialDetail?.gl}/${materialDetail?.item_number}/${materialDetail?.material_group}/${materialDetail?.material_item}/${materialDetail?.BUKRS}`,
          requestBody
        );
      }

      toast.success('Material detail updated successfully!');
      router.back();

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

  const handleCostCenterSelect = (costCenter: CostCenterItem) => {
    setSelectedCostCenter(costCenter);
    setIsCostCenterPopoverOpen(false);
    setFormValues(prev => ({
        ...prev,
        cost_center: costCenter.cost_center || '',
    }));
  };

  const handleMaterialSelect = (material: MaterialItem) => {
    setSelectedMaterial(material);
    setIsPopoverOpen(false);
    setFormValues(prev => ({
      ...prev,
      dots_number: materialDetail?.dots_number ?? '',
      material_group: material.material_group,
      material_item: material.material_item,
      gl: material.gl_account,
      short_text: `${material.material_item_desc_en} (${material.material_item})`,
      unit: material.satuan || '',
    }));
    
  };

  const handleInternalOrderSelect = (internalOrder: InternalOrders) => {
    setSelectedInternalOrder(internalOrder.internal_order);
    setIsInternalOrderPopoverOpen(false);
    setFormValues(prev => ({
        ...prev,
        internal_order: internalOrder.internal_order
    }));
  };

  const isGrayBackground = (status === '2010' && transactionType === '2' && formType === 'Cash in Advance');

  if (isLoading || isLoading2) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading material detail...</span>
      </div>
    );
  }

  if(!((status === '1010') || 
  (status === '2010' && transactionType === '2' && formType === 'Disbursement') || (status === '1060') || (status === '2010' && transactionType === '2' && formType === 'Cash in Advance'))){
    return(
      <AccessDenied/>
    )
  }

  return (
    <Layout>
      <div className="flex container mx-auto md:px-4 px-0 py-0 md:py-8 max-w-full justify-center bg-gray-50">
        <Card className="shadow-lg md:mx-0 mx-4 md:w-3/4 w-full">
          <CardHeader className="border-b">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-gray-800">Edit Material Detail</CardTitle>
              <p className="text-sm text-gray-500">Update material item information</p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Material Info Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Down Payment No</Label>
                  <Input
                    value={materialDetail?.dots_number || ''}
                    className="bg-gray-100"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                      id="type"
                      value={formType || ''}
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
                      disabled={(status === '2010' && transactionType === '2' && formType === 'Cash in Advance')}
                    >
                    <span className="truncate max-w-full block overflow-hidden text-ellipsis whitespace-nowrap">
                        {selectedCostCenter
                            ? `${selectedCostCenter.cost_center} - ${selectedCostCenter.cost_center_name}`
                            : materialDetail?.cost_center? `${materialDetail?.cost_center} - ${costCenterDesc}` : ''}
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
                {filteredInternalOrders.length > 0 && (
                <div className="space-y-2">
                    <Label htmlFor="internalOrder">Internal Order <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                            Required
                        </div>
                    </span></Label>
                    <Popover 
                        open={isInternalOrderPopoverOpen} 
                        onOpenChange={setIsInternalOrderPopoverOpen}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isInternalOrderPopoverOpen}
                                className="w-full justify-between"
                                disabled={(status === '2010' && transactionType === '2' && formType === 'Cash in Advance')}
                            >
                                <span className="truncate max-w-full block overflow-hidden text-ellipsis whitespace-nowrap">
                                    {selectedInternalOrder || materialDetail?.internal_order?materialDetail?.internal_order:''}
                                </span>
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                                order.ref_code.toLowerCase().includes(searchValueInternalOrder.toLowerCase())
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
                                                            {order.ref_code}
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
                          disabled={(status === '2010' && transactionType === '2' && formType === 'Cash in Advance')}
                      >
                      <span className="truncate max-w-full block overflow-hidden text-ellipsis whitespace-nowrap">
                          {selectedMaterial
                              ? `${selectedMaterial.material_item} - ${selectedMaterial.material_item_desc_en}`
                              : materialDetail?.material_item ? `${materialDetail?.material_item} - ${materialDesc}` : ''}
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

              <div className="space-y-2">
                <Label>Material Item (Expenses Item)</Label>
                <Input
                  value={selectedMaterial?.material_item ? selectedMaterial.material_item : materialDetail?.material_item ? materialDetail?.material_item : ''}
                  className="bg-gray-100"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label>General Ledger</Label>
                <Input
                  value={selectedMaterial?.gl_account ? selectedMaterial.gl_account : materialDetail?.gl ? materialDetail?.gl : ''}
                  className="bg-gray-100"
                  disabled
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
                    materialDetail?.short_text ? materialDetail?.short_text : ''}
                    disabled
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarkItem">Remark Item</Label>
                  <Textarea
                    id="remarkItem"
                    value={formValues.remark_item || ''}
                    onChange={(e) => setFormValues(prev => ({ ...prev, remark_item: e.target.value }))}
                    className="min-h-[120px]"
                    disabled={(status === '2010' && transactionType === '2' && formType === 'Cash in Advance')}
                    required
                  />
                </div>
              </div>

              {/* Order Unit and Unit */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderUnit">Order Unit</Label>
                    <Input
                      id="orderUnit"
                      type="number"
                      value={formValues.order_unit || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, order_unit: parseInt(e.target.value) || 1 }))}
                      min="1"
                      required
                      disabled={(status === '2010' && transactionType === '2' && formType === 'Cash in Advance')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={formValues.unit || ''}
                      className="bg-gray-100"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Amount Fields */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="baseAmount">Base Realization Amount</Label>
                  <Input
                    id="baseAmount"
                    value={baseAmount.formatted || ''}
                    onChange={(e) => handleAmountChange(e, setBaseAmount, 'base')}
                    onFocus={() => handleAmountFocus(baseAmount, setBaseAmount)}
                    onBlur={() => handleAmountBlur(baseAmount, setBaseAmount)}
                    disabled={formType === 'Cash in Advance'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="vatPercentage">VAT Percentage</Label>
                    <Checkbox 
                      id="vatEnabled"
                      checked={vatState.enabled}
                      onCheckedChange={handleVatEnabledChange}
                      className="mr-2"
                      disabled={formType === 'Cash in Advance'}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={!vatState.enabled || formType === 'Cash in Advance'}>
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
                    value={formatCurrency(vatState.amount) || ''}
                    className="bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              {/* Final Amounts */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="proposedAmount">Proposed Amount</Label>
                  <Input
                    id="proposedAmount"
                    value={proposedAmount.formatted || ''}
                    onChange={(e) => handleAmountChange(e, setProposedAmount, 'proposed')}
                    onFocus={() => handleAmountFocus(proposedAmount, setProposedAmount)}
                    onBlur={() => handleAmountBlur(proposedAmount, setProposedAmount)}
                    disabled={(formType === 'Disbursement' || (status === '2010' && transactionType === '2' && formType === 'Cash in Advance'))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="realizationAmount">Total (Realization Amount)</Label>
                  <Input
                    id="realizationAmount"
                    value={vatState.amount ? formatCurrency(Number(vatState.amount) + Number(realizationAmount.value)) : realizationAmount.formatted ? realizationAmount.formatted : ''}
                    className={`${isGrayBackground ? 'bg-white' : 'bg-gray-50'}`}
                    disabled={!(status === '2010' && transactionType === '2' && formType === 'Cash in Advance')}
                    onBlur={() => handleAmountBlur(realizationAmount, setRealizationAmount)}
                    onFocus={() => handleAmountFocus(realizationAmount, setRealizationAmount)}
                    onChange={(e) => handleAmountChange(e, setRealizationAmount, 'proposed')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="differentAmount">Different Amount</Label>
                  <Input
                    id="differentAmount"
                    value={differentAmount.formatted || ''}
                    className="bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-10">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update'
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

export default EditMaterialDetail;