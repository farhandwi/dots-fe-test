"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/lib/auth-context";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import { useAxiosJWT } from "@/hooks/useAxiosJwt";
import AdminAccessDenied from "@/components/error/admin-access-denied/page";

interface DecodedToken {
  exp: number;
}

interface CostCenterRoleMapping {
  BUKRS: string;
  user_role: string;
  cost_center: string;
  assigned_cost_center: string;
  seq_number: string;
  create_by: string;
  create_date: string;
  modified_by: string | null;
  modified_date: string | null;
  expired_date: string | null;
  is_active: boolean;
}

interface SearchParams {
  searchBukrs: string;
  searchUserRole: string;
  searchCostCenter: string;
}

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

export default function ManageCostCenterRoleMapping() {
  const ApiRole = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const router = useRouter();
  const [mappings, setMappings] = useState<CostCenterRoleMapping[] | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { user } = useAuth() as {
    user: User | null;
  };

  const [searchValues, setSearchValues] = useState<SearchParams>({
    searchBukrs: "",
    searchUserRole: "",
    searchCostCenter: "",
  });

  const [appliedSearchValues, setAppliedSearchValues] = useState<SearchParams>({
    searchBukrs: "",
    searchUserRole: "",
    searchCostCenter: "",
  });

  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [expire, setExpire] = useState<number | null>(null);
  const APIEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;

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
    if (!isTokenLoading) {
      fetchMappings(currentPage, perPage);
    }
  }, [
    currentPage,
    perPage,
    appliedSearchValues,
    token,
    isTokenLoading,
    axiosJWT,
  ]);

  const fetchMappings = async (page: number, perPage: number) => {
    setIsLoadingData(true);
    try {
      const response = await axiosJWT.get(
        `${ApiRole}/mapping-cost-center-user-types`,
        {
          params: {
            page,
            per_page: perPage,
            ...appliedSearchValues,
          },
        }
      );
      setMappings(response.data.data || []);
      setTotalPages(response.data.paging.last_page);
    } catch (error) {
      console.error("Error fetching cost center role mappings:", error);
      setMappings(null);
      setTotalPages(1);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSearchChange =
    (field: keyof SearchParams) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValues((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSearch = () => {
    setAppliedSearchValues(searchValues);
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    const emptySearchValues = {
      searchBukrs: "",
      searchUserRole: "",
      searchCostCenter: "",
    };
    setSearchValues(emptySearchValues);
    setAppliedSearchValues(emptySearchValues);
    setCurrentPage(1);
  };

  const handleAdd = () => {
    router.push("/admin/manage-cost-center-role/add");
  };

  const handleEdit = (mapping: CostCenterRoleMapping) => {
    router.push(
      `/admin/manage-cost-center-role/edit/${mapping.BUKRS}/${mapping.cost_center}/${mapping.assigned_cost_center}/${mapping.seq_number}/${mapping.user_role}`
    );
  };

  const handleDelete = async (
    bukrs: string,
    userRole: string,
    costCenter: string,
    assignedCostCenter: string,
    seqNumber: number
  ) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this cost center role mapping? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        let response = null;
        try {
          if (assignedCostCenter !== "") {
            const response = await axiosJWT.delete(
              `${ApiRole}/mapping-cost-center-user-types/${bukrs}/${costCenter}/${assignedCostCenter}/${seqNumber}/${userRole}`
            );
            Swal.fire({
              title: "Deleted!",
              text: "The cost center role mapping has been deleted successfully.",
              icon: "success",
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false,
            });

            fetchMappings(currentPage, perPage);
          } else {
            const response = await axiosJWT.delete(
              `${ApiRole}/mapping-cost-center-user-types/${bukrs}/${costCenter}/{assignedCostCenter}/${seqNumber}/${userRole}`
            );
            Swal.fire({
              title: "Deleted!",
              text: "The cost center role mapping has been deleted successfully.",
              icon: "success",
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false,
            });

            fetchMappings(currentPage, perPage);
          }
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: "Failed to delete the cost center role mapping. Please try again.",
            icon: "error",
            confirmButtonText: "OK",
          });
          console.error("Error deleting cost center role mapping:", error);
        }
      }
    });
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
    const page = selected + 1;
    setCurrentPage(page);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading cost center role mappings...</span>
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
      <div className="p-8 bg-white min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Manage Cost Center Role Mappings
          </h1>
          <Button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Mapping
          </Button>
        </div>

        {/* Search Section */}
        <div className="p-4 rounded-lg mb-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium">BUKRS</label>
              <Input
                placeholder="Search BUKRS"
                value={searchValues.searchBukrs}
                onChange={handleSearchChange("searchBukrs")}
                onKeyDown={handleKeyPress}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">User Role</label>
              <Input
                placeholder="Search User Role"
                value={searchValues.searchUserRole}
                onChange={handleSearchChange("searchUserRole")}
                onKeyDown={handleKeyPress}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cost Center</label>
              <Input
                placeholder="Search Cost Center"
                value={searchValues.searchCostCenter}
                onChange={handleSearchChange("searchCostCenter")}
                onKeyDown={handleKeyPress}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={clearSearch}
              variant="outline"
              className="text-gray-600"
            >
              Clear
            </Button>
            <Button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        <Table className="mb-10">
          <TableHeader>
            <TableRow className="border-black">
              <TableHead className="text-center">BUKRS</TableHead>
              <TableHead className="text-center">User Role</TableHead>
              <TableHead className="text-center">Cost Center</TableHead>
              <TableHead className="text-center">
                Assigned Cost Center
              </TableHead>
              <TableHead className="text-center">Sequence Number</TableHead>
              <TableHead className="text-center">Created By</TableHead>
              <TableHead className="text-center">Created Date</TableHead>
              <TableHead className="text-center">Modified By</TableHead>
              <TableHead className="text-center">Modified Date</TableHead>
              <TableHead className="text-center">Expired Date</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isTokenLoading || isLoadingData ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <span className="text-lg font-medium text-gray-600">
                        Loading data...
                      </span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : !mappings || mappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-100">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <span className="text-xl font-medium text-gray-600">
                      Data Not Found
                    </span>
                    <p className="text-sm text-gray-400 mt-2">
                      No cost center role mappings are available for your search
                      criteria
                    </p>
                    {Object.values(appliedSearchValues).some(
                      (value) => value !== ""
                    ) && (
                      <Button
                        onClick={clearSearch}
                        variant="outline"
                        className="mt-4 text-sm"
                      >
                        Clear Search Filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              mappings.map((mapping) => (
                <TableRow key={`${mapping.BUKRS}-${mapping.user_role}`}>
                  <TableCell className="text-center">{mapping.BUKRS}</TableCell>
                  <TableCell className="text-center">
                    {mapping.user_role}
                  </TableCell>
                  <TableCell className="text-center">
                    {mapping.cost_center}
                  </TableCell>
                  <TableCell className="text-center">
                    {mapping.assigned_cost_center}
                  </TableCell>
                  <TableCell className="text-center">
                    {mapping.seq_number}
                  </TableCell>
                  <TableCell className="text-center">
                    {mapping.create_by}
                  </TableCell>
                  <TableCell className="text-center">
                    {mapping.create_date}
                  </TableCell>
                  <TableCell className="text-center">
                    {mapping.modified_by || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {mapping.modified_date || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {mapping.expired_date || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(mapping)}
                        className="hover:bg-green-700 bg-green-500"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleDelete(
                            mapping.BUKRS,
                            mapping.user_role,
                            mapping.cost_center,
                            mapping.assigned_cost_center,
                            Number(mapping.seq_number)
                          )
                        }
                        className="hover:bg-red-700 bg-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-4">
          <Pagination
            pageCount={totalPages}
            onPageChange={handlePageChange}
            perPage={perPage}
            setPerPage={setPerPage}
            currentPage={currentPage}
          />
        </div>
      </div>
    </Sidebar>
  );
}
