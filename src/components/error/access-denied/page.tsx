"use client";

import React from 'react';
import { AlertOctagon, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';

export default function AccessDenied() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Main Container */}
      <div className="max-w-2xl w-full space-y-8">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="bg-yellow-100 p-3 rounded-full">
            <AlertOctagon className="w-16 h-16 text-yellow-500" />
          </div>
        </div>
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-xl text-gray-600">Oops! Something's Not Quite Right</p>
        </div>

        {/* Alert Message */}
        <Alert variant="destructive" className="bg-yellow-50 border-yellow-200">
          <AlertTitle className="text-yellow-800 flex items-center gap-2">
            <AlertOctagon className="h-4 w-4" />
            Access Restriction Notice
          </AlertTitle>
          <AlertDescription className="mt-2 text-yellow-700">
            You cannot access this page due to status incompatibility. Please contact the Shared Service Department for more information and assistance.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
            Go To Dashboard
          </Button>
          
          <Button
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            onClick={() => window.location.href = 'mailto:ITF.shared.services@tugu.com'}
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-8">
          If you believe this is a mistake or need immediate assistance,<br />
          please email us at <span className="text-blue-600">ITF.shared.services@tugu.com</span>
        </p>
      </div>
    </div>
  );
}