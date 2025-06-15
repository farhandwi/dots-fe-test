import { useMemo } from 'react';
import axios, { AxiosError } from 'axios';
import {jwtDecode} from 'jwt-decode';
import { toast } from 'react-toastify';

interface UseAxiosJWTProps {
  token: string | null;
  expire: number | null;
  setToken: (token: string | null) => void;
  setExpire: (expire: number | null) => void;
  APIEndpoint: string;
}

interface DecodedToken {
  exp: number;
}

interface ApiError {
  message?: string;
  error_desc?: string;
  status?: number;
}

export const useAxiosJWT = ({
  token,
  expire,
  setToken,
  setExpire,
  APIEndpoint
}: UseAxiosJWTProps) => {
  return useMemo(() => {
    const instance = axios.create();

    instance.interceptors.request.use(
      async (config) => {
        if (token) {
          const currentDate = new Date();
          if (expire && expire * 1000 < currentDate.getTime()) {
            const response = await axios.get(`${APIEndpoint}/token`, {
              withCredentials: true
            });
            config.headers.Authorization = `Bearer ${response.data.data.token}`;
            setToken(response.data.data.token);
            const decoded: DecodedToken = jwtDecode(response.data.data.token);
            setExpire(decoded.exp);
          } else {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        toast.error(error.response?.data?.message || 'Request error');
        window.location.href = `${process.env.NEXT_PUBLIC_TOA_END_POINT}/login`;
        return Promise.reject(error);
      }
    );

    // instance.interceptors.response.use(
    //   (response) => response,
    //   async (error) => {
    //     const axiosError = error as AxiosError<ApiError>;
        
    //     if (axiosError.response?.status === 401) {
    //       setToken(null);
    //       setExpire(null);
    //       toast.error(`Sesi anda telah berakhir. Silakan login kembali. ${axiosError.response?.status}`);
    //       window.location.href = `${process.env.NEXT_PUBLIC_TOA_END_POINT}/login`;
    //     }
        
    //     return Promise.reject(error);
    //   }
    // );

    return instance;
  }, [token, expire, APIEndpoint, setToken, setExpire]);
};