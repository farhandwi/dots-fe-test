'use client';

import React, { useState, useRef, useEffect, ReactNode, MouseEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronDown, Menu, X, ArrowLeftCircle } from 'lucide-react';
import { useAuth } from "@/lib/auth-context";

export const metadata = {
  title: 'DOTS',
  description: 'Daily Operational Tugu System Website.',
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_URL}/images/Logo.png`,
    apple: `${process.env.NEXT_PUBLIC_BASE_URL}/images/Logo.png`, 
  },
};

export const Header: React.FC = () => {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  type User = {
    profile_image: string;
    name: string;
    email: string | undefined
  };

  const { user } = useAuth() as {
    user: User | null;
  };

  const handleLogout = async () => {
    window.location.href = `${process.env.NEXT_PUBLIC_TOA_END_POINT}/dashboard`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside as unknown as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as unknown as EventListener);
    };
  }, []);

  const toggleDropdown = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="bg-white shadow-inner border-b-2 relative z-50">
      <div className="mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => router.push('/show')} 
            className="flex items-center cursor-pointer"
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_URL}/images/Logo.png`}
              alt="Dots"
              width={150}
              height={120}
              className="h-10 w-auto"
              priority 
              unoptimized
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden sm:flex sm:items-center">
            <div className="relative ml-3" ref={dropdownRef}>
              <div
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-full py-2 px-4 transition-all duration-200"
                onClick={toggleDropdown}
              >
                <img
                  src={user?.profile_image ? `data:image/png;base64,${user.profile_image}` : `${process.env.NEXT_PUBLIC_BASE_URL}/images/user-circle.png`}
                  className="h-10 w-10 rounded-full"
                  alt="User Avatar"
                />
                <span className="text-gray-700 font-medium">{user?.name || 'User'}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </div>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-100 animate-fadeIn">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    Back to Main
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        ref={mobileMenuRef}
        className={`
          fixed inset-y-0 right-0 transform w-64 bg-white shadow-2xl
          transition-transform duration-300 ease-in-out z-50
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="p-6 space-y-6">
          {/* Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>

          {/* User Info */}
          <div className="flex items-center space-x-3 pb-6 border-b border-gray-200">
            <img
              src={user?.profile_image ? `data:image/png;base64,${user.profile_image}` : `${process.env.NEXT_PUBLIC_BASE_URL}/images/user-circle.png`}
              className="h-12 w-12 rounded-full"
              alt="User Avatar"
            />
            <div>
              <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
            >
              <ArrowLeftCircle className="h-5 w-5" />
              <span>Back to Main</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  );
};

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <span className="text-gray-900 font-semibold">DOTS</span>
          <div className="hidden sm:block h-4 w-px bg-gray-300" />
          <span className="text-gray-600 text-center sm:text-left">© {currentYear} All Rights Reserved</span>
          <div className="hidden sm:block h-4 w-px bg-gray-300" />
          <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors duration-200">
            License
          </a>
        </div>

        <div className="flex items-center">
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_URL}/images/logo-dark.png`}
            alt="Tugu Insurance"
            width={80}
            height={40}
            className="opacity-80 hover:opacity-100 transition-opacity duration-200"
            priority
            unoptimized      
          />
        </div>
      </div>
    </footer>
  );
};

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow py-6 sm:py-10">
        <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 max-w-full">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;