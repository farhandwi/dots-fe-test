"use client"
import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ParamType = {
  slug: string[];
};

const ErrorPage = ({ params }: { params: ParamType }) => {
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (params.slug && params.slug.length > 0) {
      // Decode URL encoded string
      const error = decodeURIComponent(params.slug[0]);
      setErrorMessage(error);
    } else {
      setErrorMessage("Internal Server Error");
    }
  }, [params]);

  const handleBackToSSO = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_TOA_END_POINT}/dashboard`; 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h1>
          
          <div className="mb-8 w-full">
            <p className="text-gray-600 mb-4">
              We encountered an issue while processing your request.
            </p>
            
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="text-sm font-medium break-words">
                {errorMessage}
              </AlertDescription>
            </Alert>

            <p className="text-lg font-semibold text-red-600">
              Please Contact Shared Service Center
            </p>
          </div>

          <button
            onClick={handleBackToSSO}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            Back to SSO
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;