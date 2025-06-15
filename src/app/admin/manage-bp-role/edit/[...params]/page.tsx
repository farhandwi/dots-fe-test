'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
import { toast } from 'react-toastify';
import { Loader2, Save, X, XCircle, Search} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import AdminAccessDenied from '@/components/error/admin-access-denied/page';

interface DecodedToken {
    exp: number;
}

interface CostCenterData {
  cost_center: string;
  cost_center_name: string;
}

interface BPMappingData {
  BUKRS: string;
  user_role: string;
  bp: string;
  seq_number: number;
  cost_center: string;
  expired_date: string | null;
  modified_by: string | undefined;
}

interface UserType {
  BUKRS: string;
  user_role: string;
  description: string;
}

type User = {
    partner: string;
    profile_image: string;
    name: string;
    email: string;
    application: Array<{
      app_name: string;
      role: Array<{
        user_type: string;
        cost_center: string | null;
      }>;
    }>;
};

type ParamType = {
  params: string[];
};

export default function EditBPRole({ params }: { params: ParamType }) {
  const ApiBackend = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const router = useRouter();
  const [bukrs, bp, costCenter, seqNumber, userRole] = params.params;
  const { user} = useAuth() as { 
    user: User; 
  };

  const [isLoading2, setIsLoading2] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mappingData, setMappingData] = useState<BPMappingData | null>(null);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);

  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [expire, setExpire] = useState<number | null>(null);
  const APIEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [costCenterData, setCostCenterData] = useState<CostCenterData[]>([]);
  const [loadingCostCenters, setLoadingCostCenters] = useState(false);

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

  useEffect(() => {
    const fetchCostCenters = async () => {
      if (!searchValue) {
        setCostCenterData([]);
        return;
      }

      setLoadingCostCenters(true);
      try {
        const response = await axios.get(`${APIEndpoint}/cost-center?cost_center_name=${searchValue}`);
        setCostCenterData(response.data || []);
      } catch (error) {
        console.error('Error fetching cost centers:', error);
        toast.error('Failed to fetch cost centers');
      } finally {
        setLoadingCostCenters(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchCostCenters();
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [searchValue]);

  useEffect(() => {
    if(!isTokenLoading){
      fetchMappingData();
      fetchUserTypes();
    }
  }, [token, axiosJWT, isTokenLoading]);

  const fetchMappingData = async () => {
    try {
      const response = await axiosJWT.get(
        `${ApiBackend}/mapping-bp-user-types/${bukrs}/${bp}/${costCenter}/${seqNumber}/${userRole}`
      );
      setMappingData(response.data.data);
    } catch (error) {
      console.error('Error fetching mapping data:', error);
      toast.error('Failed to fetch mapping data');
    } finally {
      setIsLoading2(false);
    }
  };

  const fetchUserTypes = async () => {
    try {
      const response = await axiosJWT.get(`${ApiBackend}/get-all/user-type`);
      setUserTypes(response.data.data);
    } catch (error) {
      console.error('Error fetching user types:', error);
      toast.error('Failed to load user roles');
    }
  };

  const handleCostCenterSelect = (costCenter: CostCenterData) => {
    setMappingData(prev => prev ? {...prev, cost_center: costCenter.cost_center} : null);
    setIsPopoverOpen(false);
  };  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMappingData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setMappingData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const clearExpiredDate = () => {
    setMappingData(prev => prev ? { ...prev, expired_date: null } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!mappingData) return;

      await axiosJWT.put(
        `${ApiBackend}/mapping-bp-user-types`,
        {
          ...mappingData,
          modified_by: user?.email
        }
      );

      toast.success('BP Role mapping updated successfully');
      router.push('/admin/manage-bp-role');
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast.error('Failed to update mapping');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading2 || !mappingData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading mapping data...</span>
      </div>
    );
  }

  const dotsApp = user.application.find(app => app.app_name === "DOTS");
  const hasAdminRole = dotsApp?.role.some(role => role.user_type === "A0001");

  if (!hasAdminRole) {
      return <AdminAccessDenied />;
  }

  return (
    <Sidebar user={user}>
      <div className="p-8 max-w-full mx-auto">
        <Card className="shadow-none border-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800 pb-6">
              Edit BP Role Mapping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Company Code (BUKRS) */}
                <div className="space-y-2">
                  <Label>Company Code</Label>
                  <Input
                    name="BUKRS"
                    value={mappingData.BUKRS}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Business Partner */}
                <div className="space-y-2">
                  <Label>Business Partner</Label>
                  <Input
                    name="bp"
                    value={mappingData.bp}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* User Role */}
                <div className="space-y-2">
                  <Label>User Role</Label>
                  <Select 
                    value={mappingData.user_role}
                    onValueChange={(value) => handleSelectChange('user_role', value)}
                    disabled
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select User Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {userTypes.map(type => (
                        <SelectItem key={type.user_role} value={type.user_role}>
                          {type.user_role} - {type.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assigned Cost Center */}
                <div className="space-y-2">
                  <Label>Assigned Cost Center</Label>
                  <Popover 
                    open={isPopoverOpen} 
                    onOpenChange={(open) => {
                      if (mappingData.user_role === 'A0001' || mappingData.user_role === 'V0001' || mappingData.user_role === 'VA001') {
                        return;
                      }
                      setIsPopoverOpen(open);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isPopoverOpen}
                        className="w-full justify-between"
                        disabled={mappingData.user_role === 'A0001' || mappingData.user_role === 'V0001'}
                      >
                        {mappingData.user_role === 'A0001' || mappingData.user_role === 'V0001' 
                          ? "Not required for Admin/Viewer/VerAccounting" 
                          : mappingData.cost_center || "Select cost center..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search cost center..."
                          value={searchValue}
                          onValueChange={setSearchValue}
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No cost center found.</CommandEmpty>
                          <CommandGroup className="max-h-[300px] overflow-y-auto">
                            {loadingCostCenters ? (
                              <CommandItem>Loading...</CommandItem>
                            ) : (
                              costCenterData.map((cc) => (
                                <CommandItem
                                  key={cc.cost_center}
                                  onSelect={() => handleCostCenterSelect(cc)}
                                  className="cursor-pointer flex justify-between items-center"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium block truncate">{cc.cost_center}</span>
                                    <span className="text-gray-600 block truncate">
                                      {cc.cost_center_name}
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

                {/* Sequence Number */}
                <div className="space-y-2">
                  <Label>Sequence Number</Label>
                  <Input
                    name="seq_number"
                    value={mappingData.seq_number}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Expired Date */}
                <div className="space-y-2">
                  <Label>Expired Date</Label>
                  <div className='flex'>
                    <Input
                      type="date"
                      name="expired_date"
                      value={mappingData.expired_date ? new Date(mappingData.expired_date).toISOString().split('T')[0] : ''}
                      onChange={handleInputChange}
                      placeholder="Select Expired Date"
                      className='w-3/4'
                    />
                    {mappingData.expired_date && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={clearExpiredDate}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-6 pt-12">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push('/admin/manage-bp-role')}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Update Mapping</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
}