import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {CreditCard, Search, ArrowRight, Building, Box} from 'lucide-react'; 
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TransactionNonInsurance } from '../../types/newDots';
import React, { useState, useEffect } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { Vendor } from '../../types/newDots';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { debounce } from 'lodash';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';

interface DecodedToken {
    exp: number;
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

interface PropsVendor {
    formData: TransactionNonInsurance;
    setFormData: Dispatch<SetStateAction<TransactionNonInsurance>>; 
    setBankDetails: Dispatch<SetStateAction<BankDetail[]>>; 
}

const VendorInformationCard: React.FC<PropsVendor> = ({
    formData,
    setFormData,
    setBankDetails
}) => {
    const SapEndpoint = process.env.NEXT_PUBLIC_SAP_END_POINT;
    const [isPopoverVendorOpen, setIsPopoverVendorOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchVendorValue, setSearchVendorValue] = useState('');
    const [vendorData, setVendorData] = useState<Vendor[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

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
  
    const debouncedFetchVendors = debounce(async (keyword: string) => {
      setLoading(true);
      try {
        const response = await axios.get(`${SapEndpoint}/BussinesPartner/Vendor?limit=20&param=${keyword}`);
        const json = response.data;
        setVendorData(json.data_result || []);
      } catch (error) {
        console.error('Failed to fetch vendor data:', error);
      } finally {
        setLoading(false);
      }
    }, 1000);
  
    useEffect(() => {
      if (isTokenLoading) return;
      debouncedFetchVendors("");
      return () => debouncedFetchVendors.cancel();
    }, [isTokenLoading]);
  
    useEffect(() => {
      if (!isPopoverVendorOpen) {
        setSearchVendorValue(selectedVendor?.PARTNER || '');
      }
    }, [isPopoverVendorOpen, token, axiosJWT]);
  
    useEffect(() => {
      debouncedFetchVendors(searchVendorValue);
      return () => debouncedFetchVendors.cancel();
    }, [searchVendorValue, token, axiosJWT]);

    const handleVendorSelect = async (vendor: Vendor) => {
        setIsPopoverVendorOpen(true);
        try {
            setFormData({
                ...formData,
                client_bpid: vendor.PARTNER,
                client_name: vendor.NAME1,
                address: `${vendor.STREET}, ${vendor.CITY}`
            });
      
          if (vendor.PARTNER) {
            if(formData.dots_number.startsWith('E')) return
            const bankResponse = await axios.get(`${SapEndpoint}/BussinesPartner/BankInfo?PARTNER=${vendor.PARTNER}`);
            const bankData = bankResponse.data;
            setSelectedVendor(vendor);
            setSearchVendorValue(vendor.PARTNER);
            setBankDetails(bankData.data_result || []); 
            
            setFormData(prev => ({
              ...prev,
              employee_acct_bank_number: '',
              employee_bank_name: '',
              employee_acct_bank_name: ''
            }));
          }
        } catch (error) {
          console.error('Error fetching bank details:', error);
        } finally {
            setIsPopoverVendorOpen(false);
        }
      };

    return (
        <div>
            {/* Vendor Information Section */}
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Box className="h-5 w-5 text-blue-500" />
                    Vendor Information
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                <Popover open={isPopoverVendorOpen} onOpenChange={setIsPopoverVendorOpen}>
                    <PopoverTrigger asChild>
                        <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isPopoverVendorOpen}
                        className="w-full justify-between"
                        >
                        {formData.client_name 
                            ? `${formData.client_bpid} - ${formData.client_name}`
                            : "Select client..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command shouldFilter={false} className="w-full">
                        <CommandInput
                            placeholder="Search by ID or name..."
                            value={isPopoverVendorOpen ? searchVendorValue : (selectedVendor?.PARTNER || searchVendorValue)}
                            onValueChange={setSearchVendorValue}
                            className="h-9"
                            required
                        />
                        <CommandList>
                            <CommandEmpty>No client found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                                {loading ? (
                                    <CommandItem>Loading...</CommandItem>
                                ) : (
                                vendorData.map((vendor) => (
                                <CommandItem
                                    key={vendor.PARTNER}
                                    onSelect={() => handleVendorSelect(vendor)}
                                    className="cursor-pointer flex justify-between items-center"
                                >
                                    <div className="flex-1 min-w-0">
                                    <span className="font-medium block truncate">{vendor.PARTNER}</span>
                                    <span className="text-gray-600 block truncate">
                                        {vendor.NAME1}
                                    </span>
                                    </div>
                                </CommandItem>
                                ))
                            )}
                            </CommandGroup>
                        </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <Input 
                    placeholder="Client name" 
                    type='text' 
                    className="w-full bg-gray-100" 
                    value={formData.client_name}
                    disabled
                />
                </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <Textarea 
                placeholder="Enter address"
                className="min-h-32 bg-gray-100"
                value={formData.address}
                disabled
                />
                </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default VendorInformationCard;