"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  FileText,
  Loader2,
  BookOpen,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import { MaterialDetailResponse } from "@/types/materialDetilResponse";
import { Layout } from "@/components/Layout";
import { jwtDecode } from "jwt-decode";
import { useAxiosJWT } from "@/hooks/useAxiosJwt";

interface DecodedToken {
  exp: number;
}

const formatCurrency = (value: string, currencyType: string) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currencyType||"IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

export default function MaterialDetailPage() {
  const router = useRouter();
  const { hash_id } = useParams();
  const [materialData, setMaterialData] = useState<MaterialDetailResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const DotsEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;

  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [expire, setExpire] = useState<number | null>(null);
  const APIEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;

  const getDiffAmountColor = (diffAmount: string) => {
    const amount = parseFloat(diffAmount);
    if (amount < 0) return "text-red-600";
    return "text-orange-500";
  };

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
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (isMounted) {
          const newToken = response.data.data.token;
          setToken(newToken);
          const decoded: DecodedToken = jwtDecode(newToken);
          setExpire(decoded.exp);
          setIsTokenLoading(false);
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
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
    APIEndpoint,
  });

  useEffect(() => {
    const fetchMaterialDetail = async () => {
      try {
        const response = await axiosJWT.get(
          `${DotsEndPoint}/transaction-detail/get-detail/hash/${hash_id}`
        );

        if (response.data.error_code === 0) {
          setMaterialData(response.data.data);
        } else {
          throw new Error(
            response.data.error_desc || "Failed to fetch material details"
          );
        }
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || err.message);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    if (hash_id && !isTokenLoading) {
      fetchMaterialDetail();
    }
  }, [hash_id, token, axiosJWT, isTokenLoading]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <span className="ml-2">Loading transaction...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!materialData) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-2 border-gray-200 shadow-sm">
          {/* Page Header */}
          <CardHeader className="bg-gray-100 border-b border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <FileText className="w-8 h-8 text-blue-700" />
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Material Item Details
                  </h2>
                  <p className="text-sm text-gray-600">
                    Comprehensive Material Information
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Transaction Information Section */}
            <section className="mb-6">
              <div className="flex items-center justify-between border-b pb-2 mb-4 text-lg font-semibold text-gray-700">
                <h3 className="flex items-center md:text-xl text-sm">
                  <ClipboardList className="mr-3 text-blue-600" size={20} />
                  Transaction Details
                </h3>
                <div className="flex items-center space-x-2 pr-4">
                  <span className="text-sm font-medium text-gray-500">
                    Form Type:
                  </span>
                  <span className="md:text-xl text-sm font-bold text-black">
                    {materialData.form_type === "R"
                      ? "Disbursement"
                      : "Cash in Advance"}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <DetailRow
                  label="Dots Number"
                  value={`${materialData.dots_number}`}
                />
                <DetailRow
                  label="Material Item (Expenses Item)"
                  value={`${materialData.material_item} - ${materialData.material_item_desc_en}`}
                />
                <DetailRow
                  label="Material Item (Expenses Group)"
                  value={`${materialData.material_group} - ${materialData.material_group_desc}`}
                />
                <DetailRow
                  label="General Ledger"
                  value={`${materialData.gl} - ${materialData.gl_account_desc}`}
                />
              </div>
            </section>

            {/* Financial Information Section */}
            <section className="mb-6 bg-gray-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4 flex items-center">
                <DollarSign className="mr-3 text-green-600" size={20} />
                Financial Summary
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {materialData.form_type === "R" ? (
                  <FinancialCard
                    label="Base Amount"
                    value={formatCurrency(materialData.base_realization_amt, materialData.curr_id)}
                    color="text-green-700"
                    width="full"
                  />
                ) : (
                  <FinancialCard
                    label="Proposed Amount"
                    value={formatCurrency(materialData.proposed_amt, materialData.curr_id)}
                    color="text-green-700"
                    width="full"
                  />
                )}
                <FinancialCard
                  label="VAT Amount"
                  value={formatCurrency(materialData.vat_amt, materialData.curr_id)}
                  color="text-blue-700"
                  width="full"
                />
                <FinancialCard
                  label="Total (Realization Amount)"
                  value={formatCurrency(materialData.realization_amt, materialData.curr_id)}
                  color="text-yellow-700"
                  width="full"
                />
                <FinancialCard
                  label="Difference Amount"
                  value={formatCurrency(materialData.diff_amt, materialData.curr_id)}
                  color={getDiffAmountColor(materialData.diff_amt)}
                  width="full"
                />
              </div>
            </section>

            {/* Additional Details Section */}
            <section className="border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4 flex items-center">
                <BookOpen className="mr-3 text-gray-600" size={20} />
                Additional Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-black text-base mb-3">
                    Accounting Details
                  </h4>
                  <DetailRow
                    label="Short Text"
                    value={materialData.short_text}
                  />
                  <DetailRow
                    label="Remarks"
                    value={materialData.remark_item || "No additional remarks"}
                    className="italic text-gray-500"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-black text-base mb-3">
                    Order Information
                  </h4>
                  <div className="flex items-center space-x-4 gap-7">
                    <DetailRow
                      label="Order Unit"
                      value={`${materialData.order_unit}`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Action Button */}
            <div className="mt-6 pt-8 flex justify-between items-center">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-blue-700 transition-colors"
              >
                ← Back to Detail
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// Detail Row Component
const DetailRow: React.FC<{
  label: string;
  value: string;
  className?: string;
}> = ({ label, value, className = "" }) => (
  <div className="mb-2">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={`text-sm text-gray-800 font-medium ${className}`}>{value}</p>
  </div>
);

const FinancialCard: React.FC<{
  label: string;
  value: string;
  color: string;
  width: string;
}> = ({ label, value, color, width = "full" }) => (
  <div
    className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm w-${width}`}
  >
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={`text-base font-semibold ${color}`}>{value}</p>
  </div>
);
