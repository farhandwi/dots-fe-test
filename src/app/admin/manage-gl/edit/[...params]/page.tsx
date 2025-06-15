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

interface GLData {
    BUKRS: string;
    gl_account: string;
    gl_account_desc: string;
    modified_by: string | null;
    modified_date: string | null;
    expired_date: string | null;
    mapped_material_count: number;
    mapped_materials: string[];
    mapped_materials_desc: string[];
    full_account: string;
    is_mapped: boolean;
}

interface MaterialMappingData extends GLData {
    material_group: string;
    material_group_desc: string;
    material_item: string;
    material_item_desc_en: string;
    material_item_desc_id: string;
    satuan: string;
    type: string;
    create_by: string;
  }

interface Material {
    BUKRS: string;
    material_group: string;
    material_group_desc: string;
    material_item: string;
    material_item_desc_en: string;
    material_item_desc_id: string;
    type: string;
    satuan: string;
    full_name: string;
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

export default function EditGL({ params }: { params: ParamType }) {
  const ApiBackend = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const router = useRouter();
  const [bukrs, glAccount] = params.params;
  const { user } = useAuth() as {
    user: User;
  };

  const [isLoading2, setIsLoading2] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [glData, setGLData] = useState<GLData | null>(null);
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);
  const [isMaterialPopoverOpen, setIsMaterialPopoverOpen] = useState(false);
  const [searchValueMaterial, setSearchValueMaterial] = useState('');
  const [isFetchingMaterial, setIsFetchingMaterial] = useState(false);
  const [materialsToDelete, setMaterialsToDelete] = useState<Material[]>([]);

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

  useEffect(() => {
    if(!isTokenLoading){
      fetchGLData();
    }
  }, [token, axiosJWT, isTokenLoading]);

  useEffect(() => {
    if (user && !isLoading2 && !isTokenLoading) {
      fetchMaterials();
    }
  }, [user, isLoading2, token, axiosJWT, isTokenLoading]);

  useEffect(() => {
    const debounceSearch = setTimeout(() => {
      if (searchValueMaterial) {
        fetchMaterials();
      }
    }, 300);
  
    return () => clearTimeout(debounceSearch);
  }, [searchValueMaterial]);

  const fetchGLData = async () => {
    try {
      const response = await axiosJWT.get(`${ApiBackend}/gls/${bukrs}/${glAccount}`);
      setGLData(response.data.data);
      if (response.data.data.is_mapped && response.data.data.mapped_materials) {
        const mappedMaterials = await Promise.all(
            response.data.data.mapped_materials.map(async(material: string) => {
                const [materialGroup, materialItem] = material.split(' - ');
                const materialResponse = await axiosJWT.get(`${ApiBackend}/materials/TUGU/${materialGroup}/${materialItem}`);
                return materialResponse.data.data;
            })
        );
        setSelectedMaterials(mappedMaterials);
      }
    } catch (error) {
      console.error('Error fetching GL data:', error);
      toast.error('Failed to fetch GL data');
    } finally {
      setIsLoading2(false);
    }
  };

  const fetchMaterials = async () => {
    setIsFetchingMaterial(true);
    try {
      const response = await axiosJWT.get(`${ApiBackend}/materials/detail?${searchValueMaterial ? `search=${searchValueMaterial}` : ''}`);
      const filteredMaterials = response.data.data.filter(
        (material: Material) => 
          !selectedMaterials.some(
            (selectedMaterial) => selectedMaterial.material_item === material.material_item
          )
      );

      setMaterials(filteredMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setIsFetchingMaterial(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGLData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleMaterialSelect = (material: Material) => {
    if (!selectedMaterials.find(selected => selected.material_item === material.material_item)) {
      setSelectedMaterials(prev => [...prev, material]);
      
      const filteredMaterials = materials.filter(
        (m) => m.material_item !== material.material_item
      );
      setMaterials(filteredMaterials);
    }
    setIsMaterialPopoverOpen(false);
    setSearchValueMaterial('');
  };

  const removeMaterial = (material: Material) => {
    setSelectedMaterials(prev => prev.filter(m => m.material_item !== material.material_item));
    setMaterialsToDelete(prev => [...prev, material]);
    setMaterials(prev => [...prev, material]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!glData) return;

      const {
        mapped_material_count,
        mapped_materials,
        mapped_materials_desc,
        full_account,
        is_mapped,
        ...updateData
      } = glData;

      await axiosJWT.put(
        `${ApiBackend}/gls/${bukrs}/${glAccount}`,
        {
          ...updateData,
          modified_by: user?.email
        }
      );

      if (materialsToDelete.length > 0) {
        await Promise.all(materialsToDelete.map(material => 
          axiosJWT.delete(`${ApiBackend}/material-gl-mappings/${bukrs}/${material.material_group}/${material.material_item}/${glAccount}`)
        ));
      }

      if (selectedMaterials.length > 0) {
        await Promise.all(selectedMaterials.map(material => {
            const mappingData: MaterialMappingData = {
                ...glData,
                material_group: material.material_group,
                material_group_desc: material.material_group_desc,
                material_item: material.material_item,
                material_item_desc_en: material.material_item_desc_en,
                material_item_desc_id: material.material_item_desc_id,
                satuan: material.satuan,
                type: material.type,
                create_by: user?.email || ''
              };
          return axiosJWT.post(`${ApiBackend}/material-gl-mappings`, mappingData);
        }));
      }

      toast.success('GL Account updated successfully');
      router.push('/admin/manage-gl');
    } catch (error) {
      console.error('Error updating GL Account:', error);
      toast.error('Failed to update GL Account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearExpiredDate = () => {
    setGLData(prev => prev ? { ...prev, expired_date: null } : null);
  };

  if (isLoading2 || !glData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading GL Account data...</span>
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
              Edit GL Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* GL Account */}
                <div className="space-y-2">
                  <Label>GL Account</Label>
                  <Input
                    name="gl_account"
                    value={glData.gl_account}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* GL Account Description */}
                <div className="space-y-2">
                  <Label>GL Account Description</Label>
                  <Input
                    name="gl_account_desc"
                    value={glData.gl_account_desc}
                    onChange={handleInputChange}
                    placeholder="Enter GL Account Description"
                  />
                </div>

                {/* Expired Date */}
                <div className="space-y-2">
                  <Label>Expired Date</Label>
                  <div className='flex'>
                    <Input
                        type="date"
                        name="expired_date"
                        value={glData.expired_date ? new Date(glData.expired_date).toISOString().split('T')[0] : ''}
                        onChange={handleInputChange}
                        placeholder="Select Expired Date"
                        className='w-3/4'
                    />
                    {glData.expired_date && (
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

                {/* Material Mapping Section */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Mapped Materials</Label>
                  <div className="space-y-2">
                    {selectedMaterials.map((material) => (
                      <div key={material.material_item} className="flex items-center space-x-2">
                        <Input
                          value={`${material.material_group} - ${material.material_item} (${material.material_item_desc_en})`}
                          disabled
                          className="bg-gray-100"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeMaterial(material)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Popover open={isMaterialPopoverOpen} onOpenChange={setIsMaterialPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isMaterialPopoverOpen}
                          className="w-full justify-between"
                        >
                          <span>Select Material...</span>
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search material..."
                            value={searchValueMaterial}
                            onValueChange={setSearchValueMaterial}
                            className="h-9"
                          />
                          <CommandList>
                            {isFetchingMaterial ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="ml-2">Loading materials...</span>
                              </div>
                            ) : (
                              <>
                                {materials.length === 0 ? (
                                  <CommandEmpty>No materials found.</CommandEmpty>
                                ) : (
                                  <CommandGroup>
                                    {materials.map((material) => (
                                      <CommandItem
                                        key={material.material_item}
                                        onSelect={() => handleMaterialSelect(material)}
                                        className="cursor-pointer"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <span className="font-medium block truncate">
                                            {`${material.material_group} - ${material.material_item}`}
                                          </span>
                                          <span className="text-gray-600 block truncate">
                                            {material.material_item_desc_en}
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
                  onClick={() => router.push('/admin/manage-gl')}
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
                    <><Save className="mr-2 h-4 w-4" /> Update GL Account</>
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