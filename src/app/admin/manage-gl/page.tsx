import { Suspense } from 'react';
import ManageGLAccounts from '@/app/admin/manage-gl/ManageGl';
import { Loader2 } from 'lucide-react';

export default function Page() {
  return (
    <Suspense 
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading...</span>
        </div>
      }
    >
      <ManageGLAccounts />
    </Suspense>
  );
}