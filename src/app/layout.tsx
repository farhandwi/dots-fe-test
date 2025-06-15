'use client';

import React, { ReactNode } from "react";
import "@/styles/globals.css";
import { AuthProvider } from "@/lib/auth-context";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import "sweetalert2/dist/sweetalert2.css";

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {

  return (
    <html lang="en">
      <body>
        <AuthProvider><p></p>{children}</AuthProvider>
        <ToastContainer />
      </body>
    </html>
  );
};

export default RootLayout;
