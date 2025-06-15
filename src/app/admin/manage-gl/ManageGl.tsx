'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
  } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Loader2, Search, Check, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from "next/navigation"; 
import { usePathname, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import Pagination from '@/components/Pagination';
import { useAuth } from '@/lib/auth-context';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import AdminAccessDenied from '@/components/error/admin-access-denied/page';

interface DecodedToken {
    exp: number;
}

interface GLAccount {
  BUKRS: string;
  gl_account: string;
  gl_account_desc: string;
  expired_date: string | null;
  full_account: string;
  is_mapped: boolean;
  mapped_materials: Array<string>;
  mapped_materials_desc: Array<string>;
}

interface SearchParams {
  bukrs: string;
  gl_account: string;
  gl_account_desc: string;
  is_mapped: string;
  is_active: string;
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

export default function ManageGLAccounts() {
  const ApiBackend = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [glAccounts, setGLAccounts] = useState<GLAccount[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const { user } = useAuth() as {
    user: User;
  };

  const [searchValues, setSearchValues] = useState<SearchParams>({
    bukrs: '',
    gl_account: '',
    gl_account_desc: '',
    is_mapped: 'All',
    is_active: 'All'
  });

  const [appliedSearchValues, setAppliedSearchValues] = useState<SearchParams>({
    bukrs: '',
    gl_account: '',
    gl_account_desc: '',
    is_mapped: 'All',
    is_active: 'All'
  });

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
      fetchGLAccounts(currentPage, perPage);
    }
  }, [currentPage, perPage, appliedSearchValues, token, axiosJWT, isTokenLoading]);

  const fetchGLAccounts = async (page: number, perPage: number) => {
    try {
      setIsLoadingData(true);
      const response = await axiosJWT.get(`${ApiBackend}/gls`, {
        params: {
          page,
          per_page: perPage,
          ...appliedSearchValues
        },
      });
      setGLAccounts(response.data.data);
      setTotalPages(response.data.paging.last_page);
    } catch (error) {
      console.error('Error fetching GL Accounts:', error);
    }finally{
      setIsLoadingData(false);
    }
  };

  const handleSearchChange = (field: keyof SearchParams) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValues(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSearch = () => {
    setAppliedSearchValues(searchValues);
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    const emptySearchValues = {
      bukrs: '',
      gl_account: '',
      gl_account_desc: '',
      is_mapped: 'All',
      is_active: 'All'
    };
    setSearchValues(emptySearchValues);
    setAppliedSearchValues(emptySearchValues);
    setCurrentPage(1);
  };

  const handleAdd = () => {
    router.push('/admin/manage-gl/add')
  };

  const handleEdit = (glAccount: GLAccount) => {
    router.push(`/admin/manage-gl/edit/TUGU/${glAccount.gl_account}`);
  };

  const isActive = (expiredDate: string | null): boolean => {
    if (expiredDate === null) return true;
    const today = new Date();
    const expired = new Date(expiredDate);
    return expired > today;
  };

  const handleDelete = async (glAccount: string, email: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this General Ledger? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosJWT.delete(`${ApiBackend}/gls/TUGU/${glAccount}/${email}`);
          Swal.fire({
            title: 'Deleted!',
            text: 'The GL has been deleted successfully.',
            icon: 'success',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
          });

          fetchGLAccounts(currentPage, perPage);
        } catch (error) {
          Swal.fire({
            title: 'Error!',
            text: 'Failed to delete the GL. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
          console.error('Error deleting General Ledger:', error);
        }
      }
    });
  };

  const handleIsMappedChange = (value: string) => {
    setSearchValues(prev => ({
      ...prev,
      is_mapped: value
    }));
  };

  const handleIsActiveChange = (value: string) => {
    setSearchValues(prev => ({
      ...prev,
      is_active: value
    }));
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
    const page = selected + 1;
    setCurrentPage(page);

    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', page.toString());

    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading GL Accounts data...</span>
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
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage GL Accounts</h1>
          <Button onClick={handleAdd} className='bg-green-600 hover:bg-green-700 text-white'>
            <Plus className="w-4 h-4 mr-2" />
            Add GL Account
          </Button>
        </div>

        {/* Search Section */}
        <div className="p-4 rounded-lg mb-12">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">BUKRS</label>
              <Input
                placeholder="Search BUKRS"
                value={searchValues.bukrs}
                onChange={handleSearchChange('bukrs')}
                onKeyPress={handleKeyPress}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">GL Account</label>
              <Input
                placeholder="Search GL Account"
                value={searchValues.gl_account}
                onChange={handleSearchChange('gl_account')}
                onKeyPress={handleKeyPress}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Search GL Account Description"
                value={searchValues.gl_account_desc}
                onChange={handleSearchChange('gl_account_desc')}
                onKeyPress={handleKeyPress}
                className="mt-1"
              />
            </div>
            {/* Is Mapped Dropdown */}
            <div>
              <label className="text-sm font-medium">Is Mapped</label>
              <Select 
                value={searchValues.is_mapped} 
                onValueChange={handleIsMappedChange}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select Is Mapped" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="True">True</SelectItem>
                  <SelectItem value="False">False</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Is Active Dropdown */}
            <div>
              <label className="text-sm font-medium">Is Active</label>
              <Select 
                value={searchValues.is_active} 
                onValueChange={handleIsActiveChange}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select Is Mapped" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Non-Active">Non-Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              onClick={clearSearch}
              variant="outline"
              className="text-gray-600"
            >
              Clear
            </Button>
            <Button 
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        <Table className='mb-12'>
          <TableHeader>
            <TableRow className='border-black'>
              <TableHead className='text-center'>GL Number</TableHead>
              <TableHead className='text-center'>GL Account Description</TableHead>
              <TableHead className='text-center'>Mapped Material</TableHead>
              <TableHead className='text-center'>Is Active</TableHead>
              <TableHead className='text-center'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {isTokenLoading || isLoadingData ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="text-lg font-medium text-gray-600">Loading data...</span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )  : !glAccounts || glAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-100">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <span className="text-xl font-medium text-gray-600">Data Not Found</span>
                      <p className="text-sm text-gray-400 mt-2">
                        No cost center role mappings are available for your search criteria
                      </p>
                      {Object.values(appliedSearchValues).some(value => value !== '') && (
                        <Button
                          onClick={clearSearch}
                          variant="outline"
                          className="mt-4 text-sm"
                        >
                          Clear Search Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                glAccounts.map((account) => (
                <TableRow key={account.gl_account}>
                  <TableCell>{account.gl_account}</TableCell>
                  <TableCell>{account.gl_account_desc}</TableCell>
                  <TableCell>
                  {account.mapped_materials_desc && account.mapped_materials_desc.length > 0 ? (
                      <div className="max-h-32 overflow-y-auto">
                          <ul className="space-y-1">
                              {account.mapped_materials_desc.map((gl, index) => (
                              <li 
                                  key={index} 
                                  className="text-sm rounded px-3 py-1 mb-1 hover:bg-gray-100 transition-colors"
                              >
                                  {gl}
                              </li>
                              ))}
                          </ul>
                      </div>
                  ) : (
                      <span className="text-gray-500 italic pl-3">empty</span>
                  )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isActive(account.expired_date) ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2 justify-center">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(account)} className='hover:bg-green-700 bg-green-500'>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(account.gl_account, user?.email)} className='hover:bg-red-700 bg-red-500'>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )))}
          </TableBody>
        </Table>

        <div className="mt-4">
          <Pagination
            pageCount={totalPages}
            onPageChange={handlePageChange}
            perPage={perPage}
            setPerPage={setPerPage}
            currentPage={currentPage}
          />
        </div>
      </div>
    </Sidebar>
  );
}