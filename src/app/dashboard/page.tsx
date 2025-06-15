'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { Loading } from '@/components/ui/loading';
import { useRouter } from 'next/navigation';
import { 
  ClipboardList, 
  CheckCircle2, 
  DollarSign,
  BarChart3,
  ArrowRight
} from 'lucide-react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

type User = {
  partner: string;
  email: string;
  application: Application[];
  token?: string;
};

interface Role {
  bp: string;
  cost_center: string | null;
  user_type: string;
}

interface Application {
  application_id: number;
  app_name: string;
  alias: string;
  url: string;
  is_active: number;
  role: Role[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
    <div className="flex flex-col items-start space-y-4">
      <div className="p-3 bg-blue-50 rounded-lg">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900">
        {title}
      </h3>
      <p className="text-gray-600">
        {description}
      </p>
    </div>
  </div>
);

function getRolesByApplicationName(
  applications: Application[],
  targetName: string
): Role[] | null {
  const app = applications.find((app) => app.app_name === targetName);
  return app ? app.role : null;
}

const DotsDashboard: React.FC = () => {
  const { user } = useAuth() as {
    user: User | null;
  };
  const [role, setRole] = useState<Role[] | null>([]);

  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      const targetName = "DOTS";
      const roleDots: Role[] | null = getRolesByApplicationName(user?.application, targetName) ?? null;
      setRole(roleDots);
      
      if (roleDots) {
        const hasAdminRole = roleDots.some(role => role.user_type === 'A0001');
        setIsAdmin(hasAdminRole);
      }
    }
  }, [user]);

  const handleEnterDots = (): void => {
    router.push('/show');
  };

  const handleEnterAdmin = (): void => {
    router.push('/admin/dashboard');
  };

  if (!user) {
    return <Loading />;
  }


  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            DOTS
            <span className="block text-blue-600 text-2xl md:text-5xl mt-2">Daily Operational Tugu System</span>
          </h1>
            <p className="text-base text-gray-600 mb-8 max-w-3xl mx-auto">
              Integrated platform for Tugu Insurance's daily operational fund management.
              Simplify the process of submitting, approving, and reconciling your operational funds.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full px-4 sm:px-0">
              <Button 
                onClick={handleEnterDots}
                className="bg-blue-600 hover:bg-blue-700 text-base sm:text-lg h-10 sm:h-12 px-4 sm:px-8 w-full sm:w-auto"
              >
                Entrance to DOTS
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              {isAdmin && (
                <Button 
                  onClick={handleEnterAdmin}
                  className="bg-green-600 hover:bg-green-700 text-base sm:text-lg h-10 sm:h-12 px-4 sm:px-8 w-full sm:w-auto"
                >
                  Entrance to Admin
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <FeatureCard 
              icon={<ClipboardList className="h-8 w-8 text-blue-600" />}
              title="Structured Fund Submission"
              description="A structured and easy-to-use funding application form for daily operational needs."
            />
            <FeatureCard 
              icon={<CheckCircle2 className="h-8 w-8 text-blue-600" />}
              title="Layered Approval"
              description="The multi-level verification process by the Department Head, Group Head, and Accounting systematically"
            />
            <FeatureCard 
              icon={<DollarSign className="h-8 w-8 text-blue-600" />}
              title="SAP Integration"
              description="Directly integrated with SAP for accurate financial recording and management"
            />
            <FeatureCard 
              icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
              title="Automatic Reconciliation"
              description="Efficient fund reconciliation process with automatic calculation of differences and adjustments"
            />
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                One Platform, All Operational Processes
              </h2>
              <p className="text-gray-600 mb-6">
                DOTS provides an end-to-end solution for managing operational funds,
                from submission to reconciliation. With SAP integration,
                every transaction is recorded accurately and can be easily tracked.
              </p>
              <div className="text-sm text-gray-500">
                The system was developed specifically for the needs of Tugu Insurance
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DotsDashboard;