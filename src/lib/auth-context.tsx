/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { createContext, useContext, ReactNode } from 'react';
import { useUserData } from './use-user-data';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  error: any;
  mutate: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, error, mutate } = useUserData();

  return (
      <AuthContext.Provider value={{ user, isLoading, error, mutate }}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}