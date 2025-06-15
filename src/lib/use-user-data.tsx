import useSWR from 'swr';
import { useRouter } from 'next/navigation';

interface FetchError extends Error {
  message: string;
  status?: number;
}

const fetcher = async (url: string) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = new Error('Failed to fetch user data') as FetchError;
      error.message = await response.text();
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  } catch (err) {
    const error = err as FetchError;
    throw error;
  }
};

export function useUserData() {
  const router = useRouter();

  const { data: user, error, mutate } = useSWR<any, FetchError>('/dots/api/user', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
    onError: (err: FetchError) => {
      router.push(`/error/ssc/${err.message || 'Unknown error occurred'}`);
    }
  });

  return {
    user,
    isLoading: !error && !user,
    error,
    mutate,
  };
}