'use client'
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";
import { useAuth } from '@/lib/auth-context';
import AdminAccessDenied from "../../../components/error/admin-access-denied/page";

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

export default function Dashboard() {
    const { user } = useAuth() as {
        user: User | null;
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading transaction data...</span>
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
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <p>Welcome to the admin dashboard!</p>
            </div>
        </Sidebar>
    );
}