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
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from 'react-toastify';
import { Loader2, Save, X, Search, Trash2, XCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import AdminAccessDenied from '@/components/error/admin-access-denied/page';

interface DecodedToken {
    exp: number;
}

interface MaterialData {
  BUKRS: string;
  material_group: string;
  material_group_desc: string;
  material_item: string;
  material_item_desc_en: string;
  material_item_desc_id: string;
  satuan: string;
  type: string;
  modified_by?: string;
  expired_date?: string | null;
  is_mapped: boolean;
  mapped_gl_accounts: string[];
  mapped_gl_description: string[];
  mapped_gl_accountsCounts: number;
  full_name: string;
}

interface GLAccount {
  BUKRS: string;
  gl_account: string;
  gl_account_desc: string;
  full_account: string;
}

interface GLMappingData extends MaterialData {
  gl_account: string;
  gl_account_desc: string;
  create_by: string;
}

type ParamType = {
 params: string[];
};

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

export default function EditMaterial({ params }: { params:ParamType }) {
  const ApiBackend = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const router = useRouter();
  const [bukrs, materialGroup, materialItem] = params.params;
  const { user } = useAuth() as {
    user: User;
  };

  const [isLoading2, setIsLoading2] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [material, setMaterial] = useState<MaterialData | null>(null);
  
  // GL Account Selection States
  const [glAccounts, setGLAccounts] = useState<GLAccount[]>([]);
  const [selectedGLAccounts, setSelectedGLAccounts] = useState<GLAccount[]>([]);
  const [isGLPopoverOpen, setIsGLPopoverOpen] = useState(false);
  const [searchValueGL, setSearchValueGL] = useState('');
  const [isFetchingGL, setIsFetchingGL] = useState(false);
  const [glAccountToDelete, setGlAccountToDelete] = useState<GLAccount[]>([]);

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

  const materialTypes = ['ZMIN', 'ZMNI', 'ZMNV', 'ZSRV'];
  const units = ['EA', 'PC', 'AU'];

  useEffect(() => {
    if(!isTokenLoading){
      fetchMaterialData();
    }
  }, [token, axiosJWT, isTokenLoading]);

  useEffect(() => {
    if (user && !isLoading2 && !isTokenLoading) {
        fetchGLAccounts();
    }
  }, [user, isLoading2, token, isTokenLoading, axiosJWT]);

  useEffect(() => {
    const debounceSearch = setTimeout(() => {
      if (searchValueGL) {
        fetchGLAccounts();
      }
    }, 300);
  
    return () => clearTimeout(debounceSearch);
  }, [searchValueGL]);

  const fetchMaterialData = async () => {
    try {
      const response = await axiosJWT.get(`${ApiBackend}/materials/${bukrs}/${materialGroup}/${materialItem}`);
      setMaterial(response.data.data);
      if (response.data.data.is_mapped && response.data.data.mapped_gl_accounts) {
        const mappedGLs = await Promise.all(
          response.data.data.mapped_gl_accounts.map(async (glAccount: string) => {
            const glResponse = await axiosJWT.get(`${ApiBackend}/gls/TUGU/${glAccount}`);
            return glResponse.data.data;
          })
        );
        setSelectedGLAccounts(mappedGLs);
      }
    } catch (error) {
      console.error('Error fetching material:', error);
      toast.error('Failed to fetch material data');
    } finally {
      setIsLoading2(false);
    }
  };

  const fetchGLAccounts = async () => {
    setIsFetchingGL(true);
    try {
      const response = await axiosJWT.get(`${ApiBackend}/gls/detail`, {
        params: { search: searchValueGL }
      });

      const filteredGls = response.data.data.filter(
        (gl: GLAccount) => 
          !selectedGLAccounts.some(
            (selectedGls) => selectedGls.gl_account === gl.gl_account
          )
      );
      setGLAccounts(filteredGls);
    } catch (error) {
      console.error('Error fetching GL accounts:', error);
    } finally {
      setIsFetchingGL(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMaterial(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setMaterial(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleGLSelect = (gl: GLAccount) => {
    if (!selectedGLAccounts.find(selected => selected.gl_account === gl.gl_account)) {
      setSelectedGLAccounts(prev => [...prev, gl]);

      const filteredGls = glAccounts.filter(
        (m) => m.gl_account !== gl.gl_account
      );
      setGLAccounts(filteredGls);
    }
    setIsGLPopoverOpen(false);
    setSearchValueGL('');
  };

  const removeGLAccount = (gl: GLAccount) => {
    setSelectedGLAccounts(prev => prev.filter(g => g.gl_account !== gl.gl_account));
    setGlAccountToDelete(prev => [...prev, gl]);
    setGLAccounts(prev => [...prev, gl]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!material) return;

      const {
        mapped_gl_accounts,
        mapped_gl_description,
        is_mapped,
        full_name,
        mapped_gl_accountsCounts,
        ...updateData
      } = material;

      const updateResponse = await axiosJWT.put(
        `${ApiBackend}/materials/${bukrs}/${materialGroup}/${materialItem}`,
        {
          ...updateData,
          modified_by: user?.email
        }
      );

      if (glAccountToDelete.length > 0) {
        await Promise.all(glAccountToDelete.map(mapping => 
          axiosJWT.delete(`${ApiBackend}/material-gl-mappings/${bukrs}/${materialGroup}/${materialItem}/${mapping.gl_account}`)
        ));
      }

      if (selectedGLAccounts.length > 0) {
        await Promise.all(selectedGLAccounts.map(gl => {
          const mappingData: GLMappingData = {
            ...material,
            gl_account: gl.gl_account,
            gl_account_desc: gl.gl_account_desc,
            create_by: user?.email || ''
          };
          return axiosJWT.post(`${ApiBackend}/material-gl-mappings`, mappingData);
        }));
      }

      toast.success('Material updated successfully');
      router.push('/admin/manage-material');
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update material');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearExpiredDate = () => {
    setMaterial(prev => prev ? { ...prev, expired_date: null } : null);
  };

  if (isLoading2 || !material) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading material data...</span>
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
              Edit Material
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Material Group */}
                <div className="space-y-2">
                  <Label>Material Group</Label>
                  <Input
                    name="material_group"
                    value={material.material_group}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Material Group Description */}
                <div className="space-y-2">
                  <Label>Material Group Description</Label>
                  <Input
                    name="material_group_desc"
                    value={material.material_group_desc}
                    onChange={handleInputChange}
                    placeholder="Enter Material Group Description"
                  />
                </div>

                {/* Material Item */}
                <div className="space-y-2">
                  <Label>Material Item</Label>
                  <Input
                    name="material_item"
                    value={material.material_item}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Description (English) */}
                <div className="space-y-2">
                  <Label>Description (English)</Label>
                  <Textarea
                    name="material_item_desc_en"
                    value={material.material_item_desc_en}
                    onChange={handleInputChange}
                    placeholder="Enter English Description"
                  />
                </div>

                {/* Description (Indonesian) */}
                <div className="space-y-2">
                  <Label>Description (Indonesian)</Label>
                  <Textarea
                    name="material_item_desc_id"
                    value={material.material_item_desc_id}
                    onChange={handleInputChange}
                    placeholder="Enter Indonesian Description"
                  />
                </div>

                {/* Unit */}
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select 
                    value={material.satuan}
                    onValueChange={(value) => handleSelectChange('satuan', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Material Type */}
                <div className="space-y-2">
                  <Label>Material Type</Label>
                  <Select 
                    value={material.type}
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Material Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Expired Date */}
                <div className="space-y-2">
                  <Label>Expired Date</Label>
                  <div className='flex'>
                    <Input
                        type="date"
                        name="expired_date"
                        value={material.expired_date ? new Date(material.expired_date).toISOString().split('T')[0] : ''}
                        onChange={handleInputChange}
                        placeholder="Select Expired Date"
                        className='w-3/4'
                    />
                    {material.expired_date && (
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

                {/* GL Account Mapping Section */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>GL Accounts</Label>
                    <div className="space-y-2">
                      {selectedGLAccounts.map((gl) => (
                        <div key={gl.gl_account} className="flex items-center space-x-2">
                          <Input
                            value={`${gl.gl_account} - ${gl.gl_account_desc}`}
                            disabled
                            className="bg-gray-100"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeGLAccount(gl)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Popover open={isGLPopoverOpen} onOpenChange={setIsGLPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isGLPopoverOpen}
                            className="w-full justify-between"
                          >
                            <span>Select GL Account...</span>
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search GL account..."
                              value={searchValueGL}
                              onValueChange={setSearchValueGL}
                              className="h-9"
                            />
                            <CommandList>
                              {isFetchingGL ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="ml-2">Loading GL accounts...</span>
                                </div>
                              ) : (
                                <>
                                  {glAccounts.length === 0 ? (
                                    <CommandEmpty>No GL accounts found.</CommandEmpty>
                                  ) : (
                                    <CommandGroup>
                                      {glAccounts.map((gl) => (
                                        <CommandItem
                                          key={gl.gl_account}
                                          onSelect={() => handleGLSelect(gl)}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <span className="font-medium block truncate">
                                              {gl.gl_account}
                                            </span>
                                            <span className="text-gray-600 block truncate">
                                              {gl.gl_account_desc}
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
                  </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-6 pt-12">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push('/admin/manage-material')}
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
                    <><Save className="mr-2 h-4 w-4" /> Update Material</>
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