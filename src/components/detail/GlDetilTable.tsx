import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Boxes, Loader2 } from 'lucide-react';
import { Gl } from '@/types/gl';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';

interface DecodedToken {
    exp: number;
}

const GlItemsTable = ({ dotsNumber, status, transaction_type, form_type, currency_type  }: { dotsNumber: string, status: string, transaction_type: string, form_type: string, currency_type: string | undefined}) => {
  const [Gl, setGl] = useState<Gl[]>([]);
  const [loading, setLoading] = useState(true);
  const DotsEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;

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
    const fetchMaterialItems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          BUKRS: 'TUGU',
          dots_number: dotsNumber
        });

        const response = await axiosJWT.get(`${DotsEndPoint}/transaction-non-insurance-gl?${params.toString()}`);
        const data = response.data;
        const responseData = data.data;

        setGl(responseData);
      } catch (error) {
        console.error('Error fetching material items:', error);
      } finally {
        setLoading(false);
      }
    };

    if(!isTokenLoading){
      fetchMaterialItems();
    }

  }, [dotsNumber, DotsEndPoint, token, axiosJWT, isTokenLoading]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency_type || 'IDR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg p-6 mb-8 flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading Gl Table...</span>
      </div>
    );
  }

  return (
    <Card className="shadow-lg md:m-0 m-0 px-1 md:px-5 pb-6">
      <CardHeader className="border-b p-0 py-6">
        <CardTitle className="flex items-center gap-2 md:pl-1 pl-5">
          <Boxes className="h-5 w-5 text-blue-500" />
            General Ledger
        </CardTitle>
      </CardHeader>
      {Gl.length!==0?(
        <CardContent className="pt-4">
            <div className="overflow-x-auto rounded-sm">
            <table className="min-w-full bg-white">
                <thead className="bg-blue-500 text-white text-sm">
                <tr className="border-b-2 border-r-2 border-l-2 border-blue-500">
                    <th className="py-3 px-4 text-center">Cost Center</th>
                    <th className="py-3 px-4 text-center">GL Account</th>
                    <th className="py-3 px-4 text-center">Proposed Amount</th>
                    <th className="py-3 px-4 text-center">Total (Realization Amount)</th>
                    <th className="py-3 px-4 text-center">Difference Amount</th>
                </tr>
                </thead>
                <tbody>
                {Gl.map((item, index) => (
                    <tr
                    key={`${item.dots_number}-${index}`}
                    className="border-b-2 border-r-2 border-l-2 border-gray-200 hover:bg-gray-50"
                    >
                    <td className="py-3 px-4 text-center">{item.cost_center_desc} ({item.cost_center})</td>
                    <td className="py-3 px-4 text-center">{item.gl_desc} ({item.gl})</td>
                    <td className="py-3 px-4 text-center">{formatCurrency(Number(item.proposed_amt))}</td>
                    <td className="py-3 px-4 text-center">{formatCurrency(Number(item.realization_amt))}</td>
                    <td
                        className={`py-3 px-4 text-center ${
                        Number(item.diff_amt) > 0
                            ? 'text-green-600'
                            : Number(item.diff_amt) < 0
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                    >
                        {formatCurrency(Number(item.diff_amt))}
                    </td>
                    </tr>
                ))}
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

export default GlItemsTable;
