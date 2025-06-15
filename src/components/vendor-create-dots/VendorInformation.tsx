import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {CreditCard, Search, ArrowRight} from 'lucide-react'; 
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormData } from '../../types/newDots';
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
import { useRouter } from "next/navigation";

interface DecodedToken {
    exp: number;
}

// Define PropsVendor interface
interface PropsVendor {
    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>; 
    currentStep: number;
    setCurrentStep: (value: number) => void;
    setPartner: (value: string) => void;
    handleBack: (type: string) => void;
}

const VendorInformation: React.FC<PropsVendor> = ({
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    setPartner,
    handleBack
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
  
    const handleVendorSelect = (vendor: Vendor) => {
      if (!vendor) return;
      setSelectedVendor(vendor);
      setSearchVendorValue(vendor.PARTNER); 
      setPartner(vendor.PARTNER);
      setFormData({
        ...formData,
        clientNumber: vendor.PARTNER,
        clientName: vendor.NAME1,
        address: `${vendor.STREET}, ${vendor.CITY}`
      });
      setIsPopoverVendorOpen(false);
    };  

    const isRequiredFieldsFilled = (): boolean => {
        return !!(  
            formData.clientName &&
            formData.address 
        );
    };
    
    const handleNextStep = () => {
        if (isRequiredFieldsFilled()) {
            setCurrentStep(currentStep + 1);
        }
    };

    return (
      <div className="space-y-6 animate-fadeIn mx-auto">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                      <span className="truncate">Vendor Information</span>
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Client ID Field */}
                      <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-gray-700">
                              Client ID{" "}
                              <span className="text-red-500 relative group">
                                  *
                                  <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block z-50">
                                      Required
                                  </div>
                              </span>
                          </label>
                          <div className="relative">
                              <Popover open={isPopoverVendorOpen} onOpenChange={setIsPopoverVendorOpen}>
                                  <PopoverTrigger asChild>
                                      <Button
                                          variant="outline"
                                          role="combobox"
                                          aria-expanded={isPopoverVendorOpen}
                                          className="w-full text-left justify-between min-h-[40px] px-3"
                                      >
                                          <div className="items-start justify-start w-[calc(100%-2rem)] overflow-hidden">
                                              <span className="truncate w-full text-left">
                                                  {formData.clientNumber 
                                                      ? formData.clientNumber
                                                      : "Select client..."}
                                              </span>
                                              {formData.clientNumber && (
                                                  <span className="text-sm text-gray-500 truncate w-full">
                                                      {" - "}{formData.clientName}
                                                  </span>
                                              )}
                                          </div>
                                          <Search className="w-4 h-4 flex-shrink-0 opacity-50 ml-2" />
                                      </Button>
                                  </PopoverTrigger>
                                  <PopoverContent 
                                      className="w-[var(--radix-popover-trigger-width)] p-0" 
                                      align="start"
                                      side="bottom"
                                      sideOffset={4}
                                  >
                                      <Command shouldFilter={false} className="w-full">
                                          <CommandInput
                                              placeholder="Search by ID or name..."
                                              value={isPopoverVendorOpen ? searchVendorValue : (selectedVendor?.PARTNER || searchVendorValue)}
                                              onValueChange={setSearchVendorValue}
                                              className="h-9"
                                          />
                                          <CommandList>
                                              <CommandEmpty>No client found.</CommandEmpty>
                                              <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                  {loading ? (
                                                      <CommandItem>Loading...</CommandItem>
                                                  ) : (
                                                      vendorData.map((vendor) => (
                                                          <CommandItem
                                                              key={vendor.PARTNER}
                                                              onSelect={() => handleVendorSelect(vendor)}
                                                              className="cursor-pointer py-2 px-3 hover:bg-gray-100"
                                                          >
                                                              <div className="flex flex-col w-full min-w-0">
                                                                  <span className="font-medium truncate">
                                                                      {vendor.PARTNER}
                                                                  </span>
                                                                  <span className="text-sm text-gray-600 truncate">
                                                                      {vendor.NAME1.trim()}
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
                      </div>

                      {/* Client Name Field */}
                      <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-gray-700">
                              Client Name
                          </label>
                          <Input 
                              placeholder="Client name" 
                              type="text" 
                              className="w-full bg-gray-50 text-sm"
                              value={formData.clientName}
                              disabled
                          />
                      </div>
                  </div>

                  {/* Address Field */}
                  <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                          Address
                      </label>
                      <Textarea 
                          placeholder="Enter address"
                          className="min-h-[80px] bg-gray-50 text-sm resize-none"
                          value={formData.address}
                          disabled
                      />
                  </div>
              </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between mt-4 sm:mt-8">
              <Button 
                  variant="outline"
                  onClick={() => handleBack('vendorInformation')}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100"
              >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span className="hidden sm:inline">Back</span>
              </Button>
              <Button 
                  onClick={handleNextStep}
                  disabled={!isRequiredFieldsFilled()}
                  className={`flex items-center gap-2 px-3 py-2 ${
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
  )
}

export default VendorInformation;