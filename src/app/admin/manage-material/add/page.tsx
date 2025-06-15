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
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'react-toastify';
import { Loader2, Save, X, Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
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
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import AdminAccessDenied from '@/components/error/admin-access-denied/page';

interface DecodedToken {
    exp: number;
}

interface MaterialData {
  BUKRS: string;
  MANDT: string;
  MATNR: string;
  WEKRS: string;
  MTART: string;
  MEINS: string;
  MAKTX: string;
  BISMT: string;
  MATKL: string;
  LVORM: string;
  WGBEZ: string;
  WGBEZ60: string;
}

interface MaterialFormData {
  BUKRS: string;
  material_group: string;
  material_group_desc: string;
  material_item: string;
  material_item_desc_en: string;
  material_item_desc_id: string;
  satuan: string;
  type: string;
  create_by: string | undefined;
  expired_date?: string | null;
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

export default function AddMaterial() {
  const ApiBackend = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const SapEndpoint = process.env.NEXT_PUBLIC_SAP_END_POINT;
  const { user} = useAuth() as {
    user: User | null;
  };

  const [materialsData, setMaterialsData] = useState<MaterialData[]>([]);
  const [isPopoverOpenItem, setIsPopoverOpenItem] = useState(false);
  const [isPopoverOpenDesc, setIsPopoverOpenDesc] = useState(false);
  const [searchValueItem, setSearchValueItem] = useState('');
  const [searchValueDesc, setSearchValueDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<MaterialFormData>({
    BUKRS: 'TUGU',
    material_group: '',
    material_group_desc: '',
    material_item: '',
    material_item_desc_en: '',
    material_item_desc_id: '',
    satuan: '',
    type: '',
    create_by: '',
    expired_date: null
  });

  const router = useRouter();
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
    if (user?.email) {
      setFormData(prevData => ({
        ...prevData,
        create_by: user.email
      }));
    }
  }, [user]);

  const searchMaterials = async (searchType: 'item' | 'description', value: string) => {
    if (!value) return;
    setIsLoading(true);
    try {
      const params = {
        [searchType === 'item' ? 'param' : 'param']: value,
        LIMIT: 20
      };
      
      const response = await axios.get(`${SapEndpoint}/MD/Material`, { params });
      setMaterialsData(response.data.data_result);
    } catch (error) {
      console.error('Error searching materials:', error);
      toast.error('Failed to fetch materials data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchMaterialsData = async () => {
      if (!isTokenLoading) {
        try {
          const response = await axios.get(`${SapEndpoint}/MD/Material`);
          setMaterialsData(response.data.data_result);
        } catch (error) {
          console.error("Error fetching materials data:", error);
        }
      }
    };
  
    fetchMaterialsData();
  }, [isTokenLoading, SapEndpoint]);


  useEffect(() => {
    if (searchValueItem || !isTokenLoading) {
      searchMaterials('item', searchValueItem);
    }
  }, [searchValueItem, token, axiosJWT, isTokenLoading]);

  useEffect(() => {
    if (searchValueDesc || !isTokenLoading) {
      searchMaterials('description', searchValueDesc);
    }
  }, [searchValueDesc, token, axiosJWT, isTokenLoading]);

  const handleMaterialSelect = (material: MaterialData) => {
    setFormData(prev => ({
      ...prev,
      material_item: material.MATNR,
      material_item_desc_en: material.MAKTX,
      material_group: material.MATKL,
      material_group_desc: material.WGBEZ,
      satuan: material.MEINS,
      type: material.MTART
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const requiredFields: (keyof MaterialFormData)[] = [
        'material_item', 'material_item_desc_en',
        'material_item_desc_id'
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields`);
        setIsSubmitting(false);
        return;
      }
      await axiosJWT.post(`${ApiBackend}/materials`, formData);
      
      toast.success("Material added successfully");
      router.push(`/admin/manage-material/edit/${formData.BUKRS}/${(formData.material_group).trim()}/${(formData.material_item).trim()}`);
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error("Failed to add material. Please try again.");
    } finally {
      setIsSubmitting(false);
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
        <Card className="shadow-none border-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800 pb-6">
              Add New Material
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Material Item Popover */}
                <div className="space-y-2">
                  <Label>Material Item</Label>
                  <Popover open={isPopoverOpenItem} onOpenChange={setIsPopoverOpenItem}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isPopoverOpenItem}
                        className="w-full justify-between"
                      >
                        {formData.material_item || "Select material item..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search material item..."
                          value={searchValueItem}
                          onValueChange={setSearchValueItem}
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No material found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                            {isLoading ? (
                                <CommandItem>Loading...</CommandItem>
                              ) : (
                              materialsData.map((material) => (
                                <CommandItem
                                  key={material.MATNR}
                                  onSelect={() => {
                                    handleMaterialSelect(material);
                                    setIsPopoverOpenItem(false);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium block truncate">{material.MATNR}</span>
                                    <span className="text-gray-600 block truncate">
                                      {material.MAKTX}
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

                {/* Description English Popover */}
                <div className="space-y-2">
                  <Label>Description (English)</Label>
                  <Popover open={isPopoverOpenDesc} onOpenChange={setIsPopoverOpenDesc}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isPopoverOpenDesc}
                        className="w-full justify-between"
                      >
                        {formData.material_item_desc_en || "Select description..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search description..."
                          value={searchValueDesc}
                          onValueChange={setSearchValueDesc}
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No description found.</CommandEmpty>
                          <CommandGroup className="max-h-[300px] overflow-y-auto">
                          {isLoading ? (
                                <CommandItem>Loading...</CommandItem>
                              ) : (
                            materialsData.map((material) => (
                              <CommandItem
                                key={material.MATNR}
                                onSelect={() => {
                                  handleMaterialSelect(material);
                                  setIsPopoverOpenDesc(false);
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium block truncate">{material.MAKTX}</span>
                                  <span className="text-gray-600 block truncate">
                                    {material.MATNR}
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

                {/* Material Group */}
                <div className="space-y-2">
                  <Label>Material Group</Label>
                  <Input
                    name="material_group"
                    value={formData.material_group}
                    onChange={handleInputChange}
                    disabled
                    placeholder="Material Group"
                  />
                </div>

                {/* Material Group Description */}
                <div className="space-y-2">
                  <Label>Material Group Description</Label>
                  <Input
                    name="material_group_desc"
                    value={formData.material_group_desc}
                    onChange={handleInputChange}
                    disabled
                    placeholder="Material Group Description"
                  />
                </div>

                {/* Unit */}
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    name="satuan"
                    value={formData.satuan}
                    onChange={handleInputChange}
                    disabled
                    placeholder="Unit"
                  />
                </div>

                {/* Material Type */}
                <div className="space-y-2">
                  <Label>Material Type</Label>
                  <Input
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    disabled
                    placeholder="Material Type"
                  />
                </div>

                {/* Description Indonesian */}
                <div className="space-y-2">
                  <Label>Description (Indonesian)</Label>
                  <Textarea
                    name="material_item_desc_id"
                    value={formData.material_item_desc_id}
                    onChange={handleInputChange}
                    placeholder="Enter Indonesian Description"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    name="expired_date"
                    value={formData.expired_date || ''}
                    onChange={handleInputChange}
                  />
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
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save Material</>
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