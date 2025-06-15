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
import { toast } from 'react-toastify';
import { Loader2, Save, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import {jwtDecode} from 'jwt-decode';
import { useAxiosJWT } from '@/hooks/useAxiosJwt';
import AdminAccessDenied from '@/components/error/admin-access-denied/page';

interface GLFormData {
  BUKRS: string;
  gl_account: string;
  gl_account_desc: string;
  create_by: string | undefined;
}

interface DecodedToken {
  exp: number;
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

export default function AddGL() {
  const ApiBackend = `${process.env.NEXT_PUBLIC_DOTS_BE_END_POINT}`;
  const router = useRouter();
  const { user } = useAuth() as { 
    user: User | null;
  };

  const [formData, setFormData] = useState<GLFormData>({
    BUKRS: 'TUGU', 
    gl_account: '',
    gl_account_desc: '',
    create_by: user?.email
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [expire, setExpire] = useState<number | null>(null);
  const ApiBPMSBackend = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;

  // Initialize token
  useEffect(() => {
    const refreshToken = async () => {
      try {
        const response = await axios.get(`${ApiBPMSBackend}/token`, { 
          withCredentials: true 
        });
        setToken(response.data.data.token);
        const decoded: DecodedToken = jwtDecode(response.data.data.token);
        setExpire(decoded.exp);
      } catch (error) {
        window.location.href = `${process.env.NEXT_PUBLIC_TOA_END_POINT}/dashboard`;
      }
    };

    refreshToken();
  }, [ApiBPMSBackend, router]);

  const axiosJWT = useAxiosJWT({
    token,
    expire,
    setToken,
    setExpire,
    APIEndpoint: ApiBPMSBackend
  });


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
      const requiredFields: (keyof GLFormData)[] = [
        'gl_account', 'gl_account_desc', 'create_by'
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        toast.error(
          `Please fill in the following fields: ${missingFields.join(', ')}`
        );
        setIsSubmitting(false);
        return;
      }

      if (formData.gl_account.length > 15) {
        toast.error('GL Account must not exceed 15 characters');
        setIsSubmitting(false);
        return;
      }

      if (formData.gl_account_desc.length > 255) {
        toast.error('GL Account Description must not exceed 255 characters');
        setIsSubmitting(false);
        return;
      }

      await axiosJWT.post(`${ApiBackend}/gls`, formData);
      
      toast.success("GL Account added successfully");
      router.push(`/admin/manage-gl/edit/${formData.BUKRS}/${formData.gl_account}`);
    } catch (error) {
      console.error('Error adding GL Account:', error);
      toast.error("Failed to add GL Account. Please try again.");
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
              Add New GL Account
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
                    value={formData.gl_account}
                    onChange={handleInputChange}
                    placeholder="Enter GL Account"
                    maxLength={15}
                  />
                </div>

                {/* GL Account Description */}
                <div className="space-y-2">
                  <Label>GL Account Description</Label>
                  <Input
                    name="gl_account_desc"
                    value={formData.gl_account_desc}
                    onChange={handleInputChange}
                    placeholder="Enter GL Account Description"
                    maxLength={255}
                  />
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
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save GL Account</>
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