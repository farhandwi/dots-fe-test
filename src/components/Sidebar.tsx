import Image from 'next/image';
import Link from 'next/link';
import { Home, Users, Box, Book, ArrowLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

// Define RoleItem type
export type RoleItem = {
  cost_center: string;
  type: string;
  user_type: string;
};

// Define User type
export type User = {
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

interface SidebarProps {
  children: React.ReactNode;
  user: User;
}

const Sidebar = ({ children, user }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const SsoEndpoint = process.env.NEXT_PUBLIC_SSO_END_POINT;
  const DotsEndpoint = process.env.NEXT_PUBLIC_DOTS_FE_END_POINT;

  const menuItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: Home
    },
    {
      href: '/admin/manage-material',
      label: 'Manage Material',
      icon: Box
    },
    {
      href: '/admin/manage-gl',
      label: 'Manage Gl',
      icon: Book
    },
    {
      href: '/admin/manage-cost-center-role',
      label: 'Manage Role By Cost Center',
      icon: Users
    },
    {
      href: '/admin/manage-bp-role',
      label: 'Manage Role By Bp',
      icon: Users
    }
  ];

  const handleBackToMain = () => {
    
    window.location.href = `${SsoEndpoint}/dashboard`;
  };

  const handleBackToDots = () => {
    router.push(`/dashboard`);
  };

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-[#122166] shadow-2xl shadow-slate-400 z-40">
        <div className="flex flex-col h-full">
          <div className='bg-[#D3D3D3]'>
            {/* Logo */}
            <div className="p-4">
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_URL}/images/Logo.png`}
                alt="Company Logo"
                width={160}
                height={80}
                className="mx-auto pr-4"
                priority 
                unoptimized
              />
            </div>
            {/* Profile */}
            <div className="flex items-center p-4 border-b">
              <img
                src={user.profile_image ? `data:image/png;base64,${user.profile_image}` : 'images/user-circle.png'}
                className="h-10 w-10 rounded-full mr-2"
                alt="User Avatar"
              />
              <div className="ml-3">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-black">Admin</p>
              </div>
            </div>
          </div>
          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center p-2 text-white rounded transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'bg-[#4858a1]'
                          : 'hover:bg-[#4858a1] hover:bg-opacity-70'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
            {/* Back buttons at bottom */}
            <div className="p-2 mt-auto">
            <button
              onClick={handleBackToDots}
              className="flex items-center w-full p-2 text-white duration-200 hover:bg-[#4858a1] hover:bg-opacity-70"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              Back to Dots
            </button>
            <button
              onClick={handleBackToMain}
              className="flex items-center w-full p-2 text-white duration-200 hover:bg-[#4858a1] hover:bg-opacity-70"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              Back to Main
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content with offset */}
      <div className="flex-1 ml-64 min-h-screen bg-white">
        <main className="h-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Sidebar;
