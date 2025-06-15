import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Edit, Trash2, Plus, Minus, Eye, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MaterialItem } from '@/types/material';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Dispatch, SetStateAction } from 'react';

interface DecodedToken {
    exp: number;
}


const MaterialItemsTable = ({ dotsNumber, status, emailDots, emailInputter, transaction_type, form_type, setMaterialGroup, setMaterialData, currencyType }: { dotsNumber: string, status: string, emailDots: string, emailInputter: string, transaction_type: string, form_type: string, setMaterialGroup: Dispatch<SetStateAction<Array<string>>>, setMaterialData: Dispatch<SetStateAction<MaterialItem[]>>, currencyType: string|undefined })=> {
    const router = useRouter();
    const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const DotsEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
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
          router.push('/login');
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

  const fetchMaterialItems = async () => {
    try {
      const response = await axiosJWT.get(`${DotsEndPoint}/material-detil/get/TUGU/${dotsNumber}`);
      const data = response.data;
      const responseData: MaterialItem[] = data.data;
      setMaterialItems(responseData);
      setMaterialData(responseData);
      const materialGroupDesc = responseData.map(item => item.material_group);
      setMaterialGroup(materialGroupDesc);
    } catch (error) {
      console.error('Error fetching material items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(!isTokenLoading){
        fetchMaterialItems();
    }
  }, [dotsNumber, axiosJWT, token]);

  const toggleRow = (itemNumber: number) => {
    setExpandedRows(prev =>
      prev.includes(itemNumber)
        ? prev.filter(id => id !== itemNumber)
        : [...prev, itemNumber]
    );
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currencyType || 'IDR'
    }).format(amount);
  };

  const handleDelete = async (hashId: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this material? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Processing',
          text: 'Deleting material...',
          icon: 'info',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            container: 'z-[1400]'
          }
        });

        try {
          const dataDelete = await axiosJWT.delete(`${DotsEndPoint}/material-detil/${hashId}`);

          if (dataDelete.status !== 200) {
            throw new Error("Failed to update transaction");
          }

          Swal.fire({
            title: 'Deleted!',
            text: 'The material has been deleted successfully.',
            icon: 'success',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
          }).then(() => {
            window.location.reload(); 
          });
          
        } catch (error) {
          Swal.fire({
            title: 'Error!',
            text: 'Failed to delete the material. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
          console.error('Error deleting material:', error);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg p-6 mb-8 flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading Material Detil Table...</span>
      </div>
    );
  }

  return (
    <Card className="shadow-lg md:m-0 m-0 px-1 md:px-5 pb-6">
      <CardHeader className="border-b p-0 py-6 md:pl-1 pl-5">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-500" />
          Material Items
        </CardTitle>
      </CardHeader>
      {materialItems.length!==0 ? (
        <CardContent className="pt-4">
            <div className="overflow-x-auto rounded-sm">
            <table className="min-w-full bg-white">
                <thead className="bg-blue-500 text-white text-sm">
                <tr className={`border-b-2 border-r-2 border-l-2 border-blue-500`}>
                    <th className="sticky left-0 z-10 bg-blue-500 py-3 px-4 text-center">Actions</th>
                    <th className="py-3 px-4 text-center">Cost Center</th>
                    <th className="py-3 px-4 text-center">Material Group</th>
                    <th className="py-3 px-4 text-center">Material Item</th>
                    <th className="py-3 px-4 text-center">Internal Order</th>
                    <th className="py-3 px-4 text-center">Operations</th>
                </tr>
                </thead>
                <tbody>
                    {materialItems.map((item, index) => {
                        const uniqueKey = `${item.item_number}${index+1}`;
                        return (
                        <React.Fragment key={uniqueKey}>
                            <tr
                            className={`border-b-2 border-r-2 border-l-2 border-gray-200 hover:bg-gray-50`}
                            >
                            <td className="sticky left-0 z-10 py-3 px-4 text-center bg-white">
                                <button
                                onClick={() => toggleRow(Number(uniqueKey))}
                                className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100"
                                >
                                {expandedRows.includes(Number(uniqueKey)) ? <Minus size={20} /> : <Plus size={20} />}
                                </button>
                            </td>
                            <td className="py-3 px-4 text-center">{item.cost_center_desc} ({item.cost_center})</td>
                            <td className="py-3 px-4 text-center">{item.material_group_desc} ({item.material_group})</td>
                            <td className="py-3 px-4 text-center">{item.material_item_desc_en} ({item.material_item})</td>
                            <td className="py-3 px-4 text-center">
                              {item.internal_order ? <Check className="text-green-500 w-5 h-5 inline"  data-testid="check-icon"/> : <X className="text-red-500 w-5 h-5 inline" data-testid="x-icon"/>}
                            </td>
                            <td className="py-3 px-4 text-center">
                                <div className="flex justify-center space-x-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={()=>router.push(`/detail/material/${item.hash_id}`)} data-testid="view-button">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                {(emailDots === emailInputter) && (
                                    <>
                                      {(((status === '2010' || status === '1060') && transaction_type === '2') && form_type === 'Cash in Advance') && (
                                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={()=>router.push(`/detail/material/edit/${item.hash_id}`)} data-testid="edit-button">
                                              <Edit className="h-4 w-4" />
                                          </Button>
                                      )}
                                      {((form_type === 'Disbursement' && (status === '2010' && transaction_type === '2')) || ((status === '1010' && transaction_type === '1') && form_type === 'Cash in Advance')) && (
                                        <>
                                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={()=>router.push(`/detail/material/edit/${item.hash_id}`)} data-testid="edit-button">
                                              <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(item.hash_id)} data-testid="delete-button">
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                    </>
                                )}
                                </div>
                            </td>
                            </tr>
                            {expandedRows.includes(Number(uniqueKey)) && (
                                <tr>
                                    <td colSpan={6} className="bg-white p-6 border">
                                        <div className="bg-gray-100 rounded-lg shadow-sm p-6 space-y-4">
                                            {/* Bagian Informasi Utama */}
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Gl Account</h3>
                                                    <p className="text-gray-900 font-medium">
                                                        {item.gl_account_desc} - {item.gl}
                                                    </p>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Short Text</h3>
                                                    <p className="text-gray-900 font-medium">{item.short_text}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                              {/* Bagian Remark Full Width */}
                                              <div className="space-y-2">
                                                  <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Remark</h3>
                                                  <p className="text-gray-900 font-medium mb-6">{item.remark_item}</p>
                                              </div>
                                              {/* Bagian Remark Full Width */}
                                              <div className="space-y-2">
                                                  <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Internal Order</h3>
                                                  <p className="text-gray-900 font-medium mb-6">{(item.internal_order === '' || item.internal_order === null) ? '-' : item.internal_order}</p>
                                              </div>
                                            </div>

                                            {/* Bagian Informasi Keuangan */}
                                            <div className="grid grid-cols-3 gap-8">
                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Proposed Amount</h3>
                                                    <p className="text-green-600 font-semibold">
                                                        {formatCurrency(Number(item.proposed_amt))}
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Base Amount</h3>
                                                    <p className="text-green-600 font-semibold">
                                                        {formatCurrency(Number(item.base_realization_amt))}
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">VAT Information</h3>
                                                    <div className="text-gray-900 font-medium">
                                                        <span className="mr-2">
                                                        VAT: {item.vat_indicator ? 'Yes' : 'No'}
                                                        </span>
                                                        <span className="text-gray-500">
                                                        ({item.vat_pct}%) - {formatCurrency(Number(item.vat_amt))}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Total (Realization Amount)</h3>
                                                    <p className="text-blue-600 font-semibold">
                                                        {formatCurrency(Number(item.realization_amt))}
                                                    </p>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Difference Amount</h3>
                                                    <p className={`font-semibold ${
                                                        Number(item.diff_amt) > 0 
                                                        ? 'text-green-600' 
                                                        : Number(item.diff_amt) < 0 
                                                            ? 'text-red-600' 
                                                            : 'text-gray-900'
                                                    }`}>
                                                        {formatCurrency(Number(item.diff_amt))}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
            </div>
        </CardContent>
      ):(
        <div className="flex items-center justify-center w-full h-full pt-6 font-semibold">
            Data Not Found
        </div>
      )}
    </Card>
  );
};

export default MaterialItemsTable;