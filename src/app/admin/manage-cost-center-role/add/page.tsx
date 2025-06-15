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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Loader2, Save, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import CostCenterForm from '@/components/admin/create-cost-center-role/CostCenterInput';
import AdminAccessDenied from '@/components/error/admin-access-denied/page';

interface DecodedToken {
    exp: number;
}

interface CostCenterMappingData {
  BUKRS: string;
  user_role: string;
  cost_center: string;
  assigned_cost_center: string;
  create_by: string | undefined;
}

interface UserType {
  BUKRS: string;
  user_role: string;
  description: string;
}

type User = {
  partner: string;
  email: string;
  profile_image: string;
  name: string;
  application: Array<{
    app_name: string;
    role: Array<{
      user_type: string;
      cost_center: string | null;
    }>;
  }>;
};

export default function AddRoleCostCenter() {
  const ApiBackend = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const router = useRouter();
  const { user } = useAuth() as { 
    user: User | null;
  };

  const [formData, setFormData] = useState<CostCenterMappingData>({
    BUKRS: 'TUGU',
    user_role: '',
    cost_center: '',
    assigned_cost_center: '',
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

  // Fetch user types from API
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requiredFields: (keyof CostCenterMappingData)[] = [
        'BUKRS', 'user_role', 'cost_center', 'create_by'
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        toast.error(
          `Please fill in the following fields: ${missingFields.join(', ')}`
        );
        setIsSubmitting(false);
        return;
      }

      const response = await axiosJWT.post(
        `${ApiBackend}/mapping-cost-center-user-types`, 
        formData
      );
      
      toast.success(
        "Role Cost Center mapping added successfully",
      );

      router.push('/admin/manage-cost-center-role');
    } catch (error: unknown) { 
      console.error('Error adding role cost center mapping:', error);
      
      // Handle error dengan type checking yang aman
      let errorMessage = "Failed to add mapping. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserRoleChange = (value: string) => {
    setFormData(prev => ({...prev, user_role: value}));
    
    const disabledRoles = ['A0001', 'V0001'];
    
    if (disabledRoles.includes(value)) {
      setIsCostCenterDisabled(true);
      setFormData(prev => ({...prev, cost_center: ''}));
    } else {
      setIsCostCenterDisabled(false);
    }
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
              Add Role Cost Center Mapping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Company Code (BUKRS) */}
                <div className="space-y-2">
                  <Label>Company Code{" "}
                      <span className="text-red-500 relative group">
                          *
                          <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                              Required
                          </div>
                      </span>
                    </Label>
                  <Input
                    name="BUKRS"
                    value={formData.BUKRS}
                    onChange={handleInputChange}
                    placeholder="Enter Company Code"
                  />
                </div>

                {/* User Role */}
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
                <div className="col-span-2 w-full">
                  {/* Assigned Cost Center Input */}
                  <CostCenterForm
                    formData={formData}
                    setFormData={setFormData}
                    isCostCenterDisabled={isCostCenterDisabled}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-6 pt-12">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push('/admin/manage-cost-center-role')}
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