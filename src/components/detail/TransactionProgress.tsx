import React, { useEffect, useState } from 'react';
import { ChartColumn, Check, Loader2 } from 'lucide-react';
import type { 
  TransactionLog, 
  StatusHistoryItem, 
  StatusStep,
  TransactionProgressProps,
  StatusInfo
} from '@/types/transactionProgress';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import { useRouter } from "next/navigation";

interface DecodedToken {
    exp: number;
}

const TransactionProgress: React.FC<TransactionProgressProps> = ({ 
  formType, 
  trx_type,
  currentStatus, 
  dotsNumber
}) => {
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [statusThree, setStatusThree] = useState<TransactionLog[] | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transactionProgress, setTransactionProgress] = useState<number>();
  const [error, setError] = useState<string | null>(null);
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
    const fetchStatusHistory = async (): Promise<void> => {
      if (!dotsNumber) return;
      
      try {
        setIsLoading(true);
        const response = await axiosJWT.get(
          `${DotsEndPoint}/transaction-logs?BUKRS=TUGU&dots_number=${dotsNumber}`,
        );

        if (response.status !== 200) {
          throw new Error('Failed to fetch status history');
        }

        const responseData: { data: TransactionLog[] } = response.data;
        
        const sortedLogs = responseData.data.sort((a, b) => b.seq_number - a.seq_number);

        const hasStatusWithTwo = sortedLogs.some(log => log.status.startsWith('2'));

        const filteredLogs = hasStatusWithTwo 
          ? sortedLogs.filter(log => log.status.startsWith('2'))
          : sortedLogs;

        const processedHistory: StatusHistoryItem[] = filteredLogs
          .reduce((acc: StatusHistoryItem[], curr) => {
            if (!acc.some(item => item.status === curr.status)) {
              acc.push({
                status: curr.status,
                date: curr.modified_date,
                remark: curr.remark,
                modified_by: curr.modified_by
              });
            }
            return acc;
          }, []);

        setStatusHistory(processedHistory);
        const hasStatusWithThree = sortedLogs.filter(log => log.status.startsWith('3'));
        setStatusThree(hasStatusWithThree);

        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching status history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if(!isTokenLoading){
      fetchStatusHistory();
      const prefix = (formType === 'Cash in Advance' && trx_type === '1') ? '1' : '2';
  
      const steps = [
        { id: `${prefix}010`},
        { id: `${prefix}020`},
        { id: `${prefix}021`},
        { id: `${prefix}030`},
        { id: `${prefix}040`},
        { id: `${prefix}050`},
        { id: `${prefix}060`},
      ];
  
      const totalSteps = steps.length;
      const currentIndex = steps.findIndex(step => step.id === currentStatus); 
      const progressPercentage = ((currentIndex + 1) / totalSteps) * 100;
      setTransactionProgress(progressPercentage);
    }

  }, [dotsNumber, DotsEndPoint, currentStatus, formType, token, axiosJWT, isTokenLoading]);

  const getStatusSteps = (): StatusStep[] => {
    const prefix = (formType === 'Cash in Advance' && trx_type === '1') ? '1' : '2';
    
    return [
      { step: 1, status: `${prefix}010`, label: 'Initial' },
      { step: 2, status: `${prefix}020`, label: 'Waiting Approval 1' },
      { step: 3, status: `${prefix}021`, label: 'Waiting Approval 2' },
      { step: 4, status: `${prefix}030`, label: 'Waiting Accounting Verification' },
      { step: 5, status: `${prefix}040`, label: 'Verified' },
      { step: 6, status: `${prefix}050`, label: 'SAP Created' },
      { step: 7, status: `${prefix}060`, label: 'Paid' }
    ];
  };

  const statusSteps = getStatusSteps();

  const isStepComplete = (stepStatus: string): boolean => {
    const currentStatusNum = parseInt(currentStatus.slice(1));
    const stepStatusNum = parseInt(stepStatus.slice(1));
    return stepStatusNum <= currentStatusNum;
  };

  const formatDate = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusInfo = (status: string): StatusInfo | null => {
    const statusNum = parseInt(status.slice(1));
    const latestStatusNum = parseInt(currentStatus.slice(1));
    
    if (statusNum > latestStatusNum) {
      return null;
    }

    const historyItem = statusHistory.find(h => h.status === status);
    return historyItem ? {
      date: formatDate(historyItem.date),
      remark: historyItem.remark,
      modified_by: historyItem.modified_by
    } : null;
  };

  const isRejectedStatus = (status: string): boolean => {
    return status.startsWith('3');
  };

  const getRejectedMessage = (status: string): string => {
    if (status === '3020') return 'Rejected';
    if (status === '3010') return 'Rejected';
    if (status === '3030') return 'Rejected';
    return '';
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg p-6 mb-8 flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 mb-8 text-red-500">
        Error loading progress: {error}
      </div>
    );
  }

  if (isRejectedStatus(currentStatus)) { 
    return ( 
      <div> 
        <h2 className="text-lg font-semibold text-gray-800 border-b pl-5 py-4 mb-5"> 
          <div className='flex items-center gap-2'> 
            <ChartColumn className="h-5 w-5 text-red-500"/> 
            Transaction Progress 
          </div> 
        </h2> 
         
        <div className="p-6"> 
          <div className="flex flex-col items-center justify-center"> 
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4"> 
              <svg  
                xmlns="http://www.w3.org/2000/svg"  
                className="h-8 w-8 text-red-500"  
                fill="none"  
                viewBox="0 0 24 24"  
                stroke="currentColor" 
              > 
                <path  
                  strokeLinecap="round"  
                  strokeLinejoin="round"  
                  strokeWidth={2}  
                  d="M6 18L18 6M6 6l12 12"  
                /> 
              </svg> 
            </div> 
            <div className="text-xl font-semibold text-red-600 mb-2"> 
              {getRejectedMessage(currentStatus)} 
            </div> 
            <div className="text-sm text-gray-500"> 
              Transaction has been rejected 
            </div> 
            {statusThree && statusThree.length > 0 && ( 
              <div className="mt-4 text-center"> 
                <div className="text-sm text-gray-500"> 
                  Rejected on: {statusThree[0]?.modified_date ? formatDate(statusThree[0].modified_date) : 'N/A'} 
                </div> 
                <div className="text-sm text-gray-500 mt-1"> 
                  By: {statusThree[0]?.modified_by || 'Unknown'} 
                </div> 
                {statusThree[0]?.remark && ( 
                  <div className="text-sm text-gray-600 mt-2 p-3 bg-red-50 rounded-lg"> 
                    Reason: {statusThree[0].remark} 
                  </div> 
                )} 
              </div> 
            )} 
          </div> 
        </div> 
      </div> 
    ); 
  }

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg p-6 mb-8 flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 mb-8 text-red-500">
        Error loading progress: {error}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 border-b pl-5 py-4 mb-5">
        <div className='flex items-center gap-2'>
            <ChartColumn className="h-5 w-5 text-blue-500"/>
            Transaction Progress
        </div>
      </h2>
      
      <div className="relative">
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 mx-auto" />
        
        <div 
          className="absolute top-5 left-0 h-1 bg-blue-500 transition-all duration-500 grid md:grid-cols-7 grid-cols-2"
          style={{
            width: `${transactionProgress}%`
          }}
        />
        
        <div className="relative justify-between grid md:grid-cols-7 grid-cols-2">
          {statusSteps.map((step) => {
            const completed = isStepComplete(step.status);
            const isCurrent = currentStatus === step.status;
            const statusInfo = getStatusInfo(step.status);
            
            return (
              <div key={step.status} className="flex flex-col items-center flex-1 pb-8">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300 mb-2
                  ${completed 
                    ? "bg-blue-500 text-white" 
                    : "bg-white border-2 border-gray-300 text-gray-400"}
                  ${isCurrent ? "ring-4 ring-blue-100" : ""}
                `}>
                  {completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.step}</span>
                  )}
                </div>

                <div className={`
                  text-xs font-medium text-center
                  ${completed ? "text-blue-600" : "text-gray-500"}
                `}>
                  {step.label}
                </div>

                {statusInfo && (
                  <div className="mt-2 flex flex-col items-center">
                    <div className="text-xs text-gray-500">
                      {statusInfo.date}
                    </div>
                    {statusInfo.modified_by && (
                      <div className="text-xs text-gray-500 mt-1">
                        {statusInfo.modified_by}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TransactionProgress;