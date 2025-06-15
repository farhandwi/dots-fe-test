"use client";
import React, { useEffect, useState, useRef } from "react";
import { Plus, Minus, Eye, Check, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {useAxiosJWT} from '@/hooks/useAxiosJwt';
import { method } from "lodash";
import TotalDataDisplay from "./TotalDataDisplay";

type DataItem = {
  dots_number: string;
  bpid: string;
  dots_no_hash: string;
  status_description: string;
  status: string;
  category: string;
  form_type: string;
  purpose: string;
  start_date: string;
  end_date: string;
  created_by: string;
  dots_type: string;
  employee_name: string;
  curr_id: string;
  employee_email: string;
  total_proposed_amt: number | null;
  total_realization_amt: number | null;
  total_diff_amt: number | null;
  trx_type: string;
  client_name: string;
  category_description: string;
  form_type_description: string;
  cost_center_verificator_1: string;
  cost_center_verificator_2: string;
  cost_center_verificator_3: string;
  cost_center_verificator_4: string;
  cost_center_verificator_5: string;
  memo: string;
  memo_link: string;
};

type SearchParams = {
  dots_number: string;
  user_type: string;
  purpose: string;
  employee_name: string;
  category: string;
  form_type: string;
  status_description?: string;
  date_criteria: string;
  start_date: string;
  end_date: string;
};

type Payload = {
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

interface CostCenterApproval {
  cost_center: string;
  approval1: string;
  approval2: string;
}

interface Application {
  application_id: number;
  app_name: string;
  alias: string;
  url: string;
  is_active: number;
  role: Role[];
  cost_center_approval: CostCenterApproval;
}

interface InteractiveTableProps {
  searchParams: SearchParams;
  initialPayload: Payload;
  role: Role[] | null;
  costCenterApproval: CostCenterApproval | null |undefined;
}

interface DecodedToken {
  exp: number;
}

const InteractiveTable: React.FC<InteractiveTableProps> = ({
  searchParams,
  initialPayload,
  role,
  costCenterApproval,
}) => {
  const router = useRouter();
  const [data, setData] = useState<DataItem[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const EndpointBE = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const [token, setToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState<boolean>(true);
  const [expire, setExpire] = useState<number | null>(null);
  const [totalData, setTotalData] = useState<number | null>(null);
  const APIEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;

  const formatCurrency = (value: number, currency: string): string => {
    if (isNaN(value)) return '';
    return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
    }).format(value);
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
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        if (isMounted) {
          const newToken = response.data.data.token;
          setToken(newToken);
          const decoded: DecodedToken = jwtDecode(newToken);
          setExpire(decoded.exp);
          setIsTokenLoading(false);
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
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
    APIEndpoint
  });

  const fetchData = async (currentPage: number, roles: Role[]|null) => {
    if (loading) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        dots_number: searchParams.dots_number,
        category: searchParams.category,
        purpose: searchParams.purpose,
        user_type: searchParams.user_type,
        date_criteria: searchParams.date_criteria,
      });

      Object.entries(searchParams).forEach(([key, value]) => {
        if (value && !["date_criteria"].includes(key)) {
          queryParams.append(key, value);
        }
      });

      if (queryParams.has("start_date") && queryParams.has("end_date")) {
        if (searchParams.date_criteria === "created_date") {
          queryParams.append("created_date_start", searchParams.start_date);
          queryParams.append("created_date_end", searchParams.end_date);
        } else if (searchParams.date_criteria === "start_date") {
          queryParams.append("start_date_start", searchParams.start_date);
          queryParams.append("start_date_end", searchParams.end_date);
        } else if (searchParams.date_criteria === "end_date") {
          queryParams.append("end_date_start", searchParams.start_date);
          queryParams.append("end_date_end", searchParams.end_date);
        }
        queryParams.delete("start_date");
        queryParams.delete("end_date");
      }
      const response = await axiosJWT.post(
        `${EndpointBE}/transactions-non-insurance/get?${queryParams.toString()}`,
        { data: roles,  bp: initialPayload.partner, cost_center: costCenterApproval, email: initialPayload.email}
      );

      const jsonData = response.data;

      setTotalData(jsonData.data.total);

      if (
        jsonData.data?.data &&
        Array.isArray(jsonData.data.data) &&
        jsonData.data.data.length > 0
      ) {
        setData((prevData) =>
          currentPage === 1
            ? jsonData.data.data
            : [...prevData, ...jsonData.data.data]
        );
        setPage(currentPage + 1);

        setHasMoreData(true);
      } else {
        setHasMoreData(false);
        if (currentPage === 1) {
          toast.error("Data Empty!");
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("An error while get data");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (!role || isTokenLoading ) return;
    setPage(1);
    setData([]);
    fetchData(1, role);
  }, [searchParams, EndpointBE, token, axiosJWT, isTokenLoading]);

  useEffect(() => {
    if (loading || !hasMoreData || !role) return;
  
    const currentObserver = observer.current;
    if (currentObserver) currentObserver.disconnect();
  
    const newObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && hasMoreData) {
        if (role) fetchData(page, role);
      }
    });
  
    if (loadMoreRef.current) {
      newObserver.observe(loadMoreRef.current);
    }
  
    observer.current = newObserver;
  
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, hasMoreData, page, role]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleApprove = async (dotsNumber: string, status: string, bpid: string) => {
    if (!role) return;
  
    let roleTypes: string[];
    if (["1020", "2020"].includes(status)) {
      roleTypes = ["VD001", "VG001"];
    } else if (["1021", "2021"].includes(status)) {
      roleTypes = ["VG001"];
    } else if (["1030", "2030"].includes(status)) {
      roleTypes = ["VA001"];
    } else {
      console.error("Invalid status for approval");
      return;
    }
    
    const roleObject = role?.find(
      (r) => roleTypes.includes(r.user_type)
    );
    if (!roleObject) {
      console.error("Required role not found");
      return;
    }
  
    try {
      const result = await Swal.fire({
        title: 'Approve Transaction',
        text: `Are you sure you want to approve transaction ${dotsNumber}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'Cancel',
        customClass: {
          container: 'z-[1400]' 
        }
      });
  
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Processing',
          text: 'Approving transaction...',
          icon: 'info',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            container: 'z-[1400]'
          }
        });

        const responseApproval = await axiosJWT.get(
          `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/cost-center-approval/${bpid}`
        );
        const dataListApproval = responseApproval.data.cost_center_approval;
  
        const response = await axiosJWT.post(
          `${EndpointBE}/dots/approval/${initialPayload.email}/${dotsNumber}`, {roles: role, remark: null, cost_center_approval: dataListApproval}
        );
  
        if (response.status !== 200) {
          throw new Error("Failed to update transaction");
        }

        await Swal.fire({
          title: 'Approved!',
          text: 'Transaction has been approved successfully.',
          icon: 'success',
          customClass: {
            container: 'z-[1400]'
          }
        });

        setPage(1);
        setData([]);
        if(role)fetchData(1, role);
  
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      
      // Show error message
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to approve transaction. Please try again.',
        icon: 'error',
        customClass: {
          container: 'z-[1400]'
        }
      });
    }
  };

  const canApprove = (transaction: DataItem): boolean => {
    if (!role) return false;
  
    if (["2020", "1020"].includes(transaction.status)) {
      return role.some(
        (roleItem) =>
          (roleItem.user_type === "VD001" &&
          roleItem.cost_center &&
          roleItem.cost_center === transaction.cost_center_verificator_1) ||
          (roleItem.user_type === "VG001" &&
          roleItem.cost_center &&
          (transaction.cost_center_verificator_2 === null && roleItem.cost_center === transaction.cost_center_verificator_1))
      );
    }
  
    if (["2021", "1021"].includes(transaction.status)) {
      return role.some(
        (roleItem) =>
          (roleItem.user_type === "VG001" &&
          roleItem.cost_center &&
          (roleItem.cost_center === transaction.cost_center_verificator_2)) || (roleItem.user_type === "VG001" && (transaction.cost_center_verificator_2 === null) && (roleItem.cost_center === transaction.cost_center_verificator_1))
      );
    }
  
    return false;
  };

  if (!data || (data.length === 0 && !loading) && !isTokenLoading) {
    return <p className="text-center text-red-600">Data Empty</p>;
  }
  
  return (
    <div className="mt-4">
      {!loading && <TotalDataDisplay total={totalData} />}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-blue-500 text-white text-sm">
            <tr>
              <th className="sticky left-0 z-10 bg-blue-500 py-3 px-4 text-center">
                Actions
              </th>
              <th className="py-3 px-4 text-left">Dots Number</th>
              <th className="py-3 px-4 text-left">Dots Type</th>
              <th className="py-3 px-4 text-left">Employee Name</th>
              <th className="py-3 px-4 text-left">Created By</th>
              <th className="py-3 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <React.Fragment key={item.dots_number}>
                <tr
                  className={`border-b border-gray-200 hover:bg-gray-50 transition duration-150 ease-in-out ${index % 2 === 1 ? "bg-gray-100" : ""
                    } ${expandedRows.includes(item.dots_number) ? "bg-gray-200" : ""
                    }`}
                  style={{ fontSize: "0.875rem" }}
                >
                  <td
                    className={`sticky left-0 z-10 py-3 px-4 ${index % 2 === 1 ? "bg-gray-100" : "bg-white"
                      }`}
                  >
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        onClick={() => toggleRow(item.dots_number)}
                        className="text-blue-500 hover:text-blue-700 transition duration-150 ease-in-out p-1 rounded-full hover:bg-blue-100"
                      >
                        {expandedRows.includes(item.dots_number) ? (
                          <Minus size={20} />
                        ) : (
                          <Plus size={20} />
                        )}
                      </button>
                      <button className="bg-blue-500 hover:bg-blue-700 text-white p-1 rounded-full transition duration-150 ease-in-out">
                      <Eye
                        size={20}
                        onClick={() => {
                          window.open(`/dots/detail/${item.dots_no_hash}`, '_blank');
                        }}
                        className="cursor-pointer"
                      />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{item.dots_number}</td>
                  <td className="py-3 px-4">{item.dots_type}</td>
                  <td className="py-3 px-4">{item.employee_name}</td>
                  <td className="py-3 px-4">{item.created_by}</td>
                  <td className="py-3 px-4">{item.status_description}</td>
                </tr>
                {expandedRows.includes(item.dots_number) && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-3 px-4 bg-gray-50 border-b border-t border-black"
                    >
                      <div className="p-4 bg-white rounded-lg shadow-md">
                        <div className="text-black font-normal text-sm">
                          <h2 className="text-lg font-bold mb-2">
                            Detail Data
                          </h2>
                          <div className="grid grid-cols-2 gap-3 gap-x-8">
                            <div className="flex justify-between py-2 border-b border-gray-300">
                              <span className="font-bold pr-16">Category</span>
                              <span className="text-right">
                                {item.category_description}
                              </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-300">
                              <span className="font-bold">Form Type</span>
                              <span className="text-right">
                                {item.form_type_description}
                              </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-300">
                              <span className="font-bold">Client Name</span>
                              <span className="text-right">
                                {item.client_name}
                              </span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="font-bold">Memo Number</span>
                              <span className="text-right">
                                <a href={item.memo_link} target="_blank" rel="noopener noreferrer">
                                  {item.memo}
                                </a>
                              </span>
                            </div>
                            <div className="flex justify-between py-2 pb-2 border-b border-gray-300">
                              <span className="font-bold pr-12 ">
                                Start Date
                              </span>
                              <span className="text-right">
                                {new Date(item.start_date).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex justify-between py-2 pb-2 border-b border-gray-300">
                              <span className="font-bold">End Date</span>
                              <span className="text-right">
                                {new Date(item.end_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex col-span-2 mb-5 pb-2  border-b border-gray-300">
                              <div className="py-2 justify-between ">
                                <span className="font-bold pr-16 text-le">
                                  Purpose
                                </span>
                              </div>
                              <div className="py-2 justify-between">
                                <span className="text-center">
                                  {item.purpose}
                                </span>
                              </div>
                            </div>
                          </div>
                          <table className="w-full">
                            <tr className="col-span-2 grid grid-cols-4 gap-6 text-center md:mx-16">
                              <td>
                                <div className="flex flex-col items-center">
                                  <span className="font-bold mb-1">
                                    Currency
                                  </span>
                                  <span>{item.curr_id}</span>
                                </div>
                              </td>
                              <td>
                                <div className="flex flex-col">
                                  <span className="font-bold mb-1">
                                    Total Proposed Amount
                                  </span>
                                  <span className="text-right md:px-12">
                                    {item.total_proposed_amt
                                      ? formatCurrency(item.total_proposed_amt, item.curr_id)
                                      : "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="flex flex-col">
                                  <span className="font-bold mb-1">
                                    Total Realization Amount
                                  </span>
                                  <span className="text-right md:px-12">
                                    {item.total_realization_amt
                                      ? formatCurrency(item.total_realization_amt, item.curr_id)
                                      : "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="flex flex-col">
                                  <span className="font-bold mb-1">
                                    Total Difference Amount
                                  </span>
                                  <span className="text-right md:px-12">
                                    {item.total_diff_amt
                                      ? formatCurrency(item.total_diff_amt, item.curr_id)
                                      : "N/A"}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          </table>
                          {canApprove(item) && (
                            <div className="mt-8 flex justify-end">
                              <button
                                onClick={() =>
                                  handleApprove(item.dots_number, item.status, item.bpid)
                                }
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
                              >
                                <Check size={20} className="mr-2" />
                                Approve
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {!isTokenLoading && !loading && data.length > 0 ? (
        <div ref={loadMoreRef} className="h-10" />
      ):(
        <div className="flex justify-center items-center min-h-32">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2">Loading transaction...</span>
        </div>
      )}
    </div>
  );
};

export default InteractiveTable;
