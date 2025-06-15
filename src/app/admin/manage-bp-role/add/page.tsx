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
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Loader2, Save, X , Search} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import AdminAccessDenied from '@/components/error/admin-access-denied/page';

interface DecodedToken {
    exp: number;
}

interface UserType {
  BUKRS: string;
  user_role: string;
  description: string;
}

interface CostCenterData {
  cost_center: string;
  cost_center_name: string;
}

interface BPMappingData {
  BUKRS: string;
  user_role: string;
  bp: string;
  cost_center: string;
  create_by: string | undefined;
}

interface UserType {
  BUKRS: string;
  user_role: string;
  description: string;
}

interface BPData {
  partner: string;
  name_first: string;
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

export default function AddBPRole() {
  const ApiBackend = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const ApiBpmsEndpoint = process.env.NEXT_PUBLIC_BPMS_BE_END_POINT;
  const SapEndpoint = process.env.NEXT_PUBLIC_SAP_END_POINT;
  const router = useRouter();
  const { user} = useAuth() as { 
    user: User | null; 
  };

  const [formData, setFormData] = useState<BPMappingData>({
    BUKRS: 'TUGU',
    user_role: '',
    bp: '',
    cost_center: '',
    create_by: ''
  });

  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUserTypes, setIsLoadingUserTypes] = useState(true);
  const [isCostCenterDisabled, setIsCostCenterDisabled] = useState(true);
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [expire, setExpire] = useState<number | null>(null);
  const APIEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;

  const [isBPPopoverOpen, setIsBPPopoverOpen] = useState(false);
  const [searchBPValue, setSearchBPValue] = useState('');
  const [bpData, setBPData] = useState<BPData[]>([]);
  const [loadingBP, setLoadingBP] = useState(false);

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
        const response = await axiosJWT.get(`${ApiBpmsEndpoint}/cost-center?cost_center_name=${searchValue}`);
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
    const fetchUserTypes = async () => {
      try {
        const response = await axiosJWT.get(`${ApiBackend}/get-all/user-type`);
        setUserTypes(response.data.data);
      } catch (error) {
        console.error('Error fetching user types:', error);
        toast.error('Failed to load user roles');
      } finally {
        setIsLoadingUserTypes(false);
      }
    };

    if(!isTokenLoading){
      fetchUserTypes();
    }

  }, [ApiBackend, token, axiosJWT, isTokenLoading]);

  useEffect(() => {    
    if(user) {
      setFormData(prev => ({
        ...prev,
        create_by: user.email
      }));
    }
  }, [user]);

  const handleCostCenterSelect = (costCenter: CostCenterData) => {
    setFormData(prev => ({
      ...prev,
      cost_center: costCenter.cost_center
    }));
    setIsPopoverOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    const fetchBP = async () => {
      if (!searchBPValue) {
        setBPData([]);
        return;
      }

      setLoadingBP(true);
      try {
        const response = await axios.get(`${ApiBpmsEndpoint}/employee?partner=${searchBPValue}`);
        setBPData(response.data || []);
      } catch (error) {
        console.error('Error fetching BP:', error);
        toast.error('Failed to fetch BP data');
      } finally {
        setLoadingBP(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchBP();
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [searchBPValue]);

  const handleBPSelect = (bp: BPData) => {
    setFormData(prev => ({
      ...prev,
      bp: bp.partner
    }));
    setIsBPPopoverOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let requiredFields: (keyof BPMappingData)[] = [];
      if(formData.user_role === 'IS001'){
        requiredFields = [
          'BUKRS', 'user_role', 'bp', 'create_by'
        ]
      }else if(isCostCenterDisabled || !formData.user_role){
        requiredFields = [
          'BUKRS', 'user_role', 'bp', 'create_by'
        ];
      }else{
        requiredFields = [
          'BUKRS', 'user_role', 'bp', 'cost_center', 'create_by'
        ];
      }
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        toast.error(
          `Please fill in the following fields: ${missingFields.join(', ')}`
        );
        setIsSubmitting(false);
        return;
      }

      await axiosJWT.post(
        `${ApiBackend}/mapping-bp-user-types`, 
        formData
      );
      
      toast.success(
        "BP Role mapping added successfully",
      );

      router.push('/admin/manage-bp-role');
    } catch (error) {
      console.error('Error adding BP role mapping:', error);
      toast.error("Failed to add mapping. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserRoleChange = (value: string) => {
    setFormData(prev => ({...prev, user_role: value, cost_center: ''}));
    
    const disabledRoles = ['A0001', 'V0001', 'VA001'];
    setIsCostCenterDisabled(disabledRoles.includes(value));
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading...</span>
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
        <Card className='shadow-none border-none'>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800 pb-6">
              Add BP Role Mapping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Code</Label>
                  <Input
                    name="BUKRS"
                    value={formData.BUKRS}
                    onChange={handleInputChange}
                    placeholder="Enter Company Code"
                  />
                </div>

                <div className="space-y-2">
                  <Label>User Role</Label>
                  <Select 
                    name="user_role"
                    value={formData.user_role}
                    onValueChange={handleUserRoleChange}
                    disabled={isLoadingUserTypes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingUserTypes ? "Loading..." : "Select User Role"} />
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

                {/* BP field with search */}
                <div className="space-y-2">
                  <Label>Business Partner</Label>
                  <Popover 
                    open={isBPPopoverOpen} 
                    onOpenChange={setIsBPPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isBPPopoverOpen}
                        className="w-full justify-between"
                      >
                        {formData.bp || "Search business partner..."}
                        {loadingBP ? (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search business partner..."
                          value={searchBPValue}
                          onValueChange={setSearchBPValue}
                          className="h-9"
                        />
                        <CommandList>
                          {loadingBP ? (
                            <CommandItem>Loading...</CommandItem>
                          ) : !Array.isArray(bpData) || bpData.length === 0 ? (
                            <CommandEmpty>Cost center data not found.</CommandEmpty>
                          ) : (
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                              {bpData.map((bp) => (
                                <CommandItem
                                  key={bp.partner}
                                  onSelect={() => handleBPSelect(bp)}
                                  className="cursor-pointer flex justify-between items-center"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium block truncate">{bp.partner}</span>
                                    <span className="text-gray-600 block truncate">
                                      {bp.name_first}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Cost Center Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Cost Center</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button">
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Please fill in the user role first, Admin and Viewer do not have a cost center.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Popover 
                    open={isPopoverOpen} 
                    onOpenChange={(open) => {
                      if (!formData.user_role) {
                        toast.warning('Please select a User Role first');
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
                        disabled={isCostCenterDisabled || !formData.user_role}
                      >
                        {formData.cost_center || "Select cost center..."}
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
                          {loadingCostCenters ? (
                            <CommandItem>Loading...</CommandItem>
                          ) : !Array.isArray(costCenterData) || costCenterData.length === 0 ? (
                            <CommandEmpty>Cost center data not found.</CommandEmpty>
                          ) : (
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                              {costCenterData.map((cc) => (
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
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

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
                  disabled={isSubmitting || isLoadingUserTypes}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save Mapping</>
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