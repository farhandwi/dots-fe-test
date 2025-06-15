/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import InteractiveTable from "@/components/InteractiveTable";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Loading } from "@/components/ui/loading";
import Datepicker from "tailwind-datepicker-react";
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';

type SearchInputs = {
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
  status_group?: string[];
};

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

const ShowPage = () => {
  const options: any = {
    title: "",
    autoHide: true,
    todayBtn: true,
    clearBtn: true,
    clearBtnText: "Clear",
    maxDate: new Date("2030-01-01"),
    minDate: new Date("1950-01-01"),
    theme: {
      background: "bg-white",
      todayBtn: "",
      clearBtn: "",
      icons: "",
      text: "",
      disabledText: "bg-white-500",
      input: "h-9 text-black border rounded-md bg-white",
      inputIcon: "text-gray-400 w-4",
      selected: "",
    },
    icons: {
      prev: () => <span>Previous</span>,
      next: () => <span>Next</span>,
    },
    datepickerClassNames: "top-90 p-1 h-2 w-full border rounded-md text-xs text-black",
    defaultDate: null,
    language: "en",
    disabledDates: [],
    weekDays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    inputNameProp: "date",
    inputIdProp: "date",
    inputPlaceholderProp: "Select Date",
    inputDateFormatProp: {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  };
  const [showStartDate, setShowStartDate] = useState<boolean>(false);
  const [showEndDate, setEndDate] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [role, setRole] = useState<Role[] | null>([]);
  const [costCenterApproval, setCostCenterApproval] = useState<CostCenterApproval | null>();

  function getRolesByApplicationName(
    applications: Application[],
    targetName: string
  ): Role[] | null {
    const app = applications.find((app) => app.app_name === targetName);
    return app ? app.role : null;
  }

  function getCostCenter(
    applications: Application[],
    targetName: string
  ): CostCenterApproval | null {
    const app = applications.find((app) => app.app_name === targetName);
    return app ? app.cost_center_approval : null;
  }


  const handleCloseStartDate = (state: boolean) => {
    setShowStartDate(state)
  }
  const handleCloseEndDate = (state: boolean) => {
    setEndDate(state)
  }

  const getInitialSearchInputs = React.useCallback(
    (user: User | null, currentRole: Role[] | null): SearchInputs => {
      const getDefaultStatus = (formType: string) => {
        if (!formType && user && currentRole) {
          const roleTypes = currentRole.map(
            (r: Role) => r.user_type
          );
          const specialRoles = [];
  
          if (roleTypes.some((role) => role.startsWith("VD")))
            specialRoles.push("VD");
          if (roleTypes.some((role) => role.startsWith("VG")))
            specialRoles.push("VG");
          if (roleTypes.some((role) => role.startsWith("VA")))
            specialRoles.push("VA");
  
          const statusGroup = specialRoles
            .map((roleType) => {
              switch (roleType) {
                case "VD":
                  return "VerifiedDH";
                case "VG":
                  return "VerifiedGH";
                case "VA":
                  return "VerifiedAccounting";
                default:
                  return "";
              }
            })
            .filter((status) => status !== "");
  
          return {
            statusDescription: undefined,
            statusGroup,
          };
        }
  
        return {
          statusDescription: "",
          statusGroup: undefined,
        };
      };
  
      const { statusDescription, statusGroup } = getDefaultStatus("");
  
      return {
        dots_number: "",
        user_type: "",
        purpose: "",
        employee_name: "",
        category: "",
        form_type: "",
        status_description: statusDescription,
        date_criteria: "created_date",
        start_date: "",
        end_date: "",
        status_group: statusGroup,
      };
    },
    [role]
  );

  const [searchInputs, setSearchInputs] = useState<SearchInputs>(() =>
    getInitialSearchInputs(null, null)
  );
  
  const [appliedSearchParams, setAppliedSearchParams] = useState<SearchInputs>(
    () => getInitialSearchInputs(null, null)
  );

  const handleStartDate = (selectedDate: Date) => {

    const formattedDate = format(new Date(selectedDate), 'yyyy-MM-dd');
    handleInputChange('start_date', formattedDate)
  };
  const handleEndDate = (selectedDate: Date) => {
    const formattedDate = format(new Date(selectedDate), 'yyyy-MM-dd');
    handleInputChange('end_date', formattedDate)
  };

  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useAuth() as {
    user: User | null;
  };
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (user && !isInitialized) {
      const targetName = "DOTS";
      const roleDots: Role[] | null = getRolesByApplicationName(user?.application, targetName) ?? null;
      const costCenter: CostCenterApproval | null = getCostCenter(user?.application, targetName) ?? null;
      setRole(roleDots);
      setCostCenterApproval(costCenter);
      
      const initialState = getInitialSearchInputs(user, roleDots);
      setSearchInputs(initialState);
      setAppliedSearchParams(initialState);
      setIsInitialized(true);
    }
  }, [user, getInitialSearchInputs, isInitialized]);

  const router = useRouter();

  const formTypeOptions = [
    { label: "Select Form Type", value: "" },
    { label: "Cash In Advance", value: "C" },
    { label: "Disbursement", value: "R" },
  ];

  const categoryOptions = {
    C: [
      { label: "Business Event", value: "D" },
      { label: "Business Trip", value: "H" },
    ],
    R: [
      { label: "Reimbursement", value: "R" },
      { label: "Compensation & Benefit", value: "C" },
      { label: "Cash Card", value: "A" },
    ],
  };

  const statusOptions = [
    { label: "Initial (Cash in Advance)", value: "1010" },
    { label: "Waiting Approval 1 (Cash in Advance)", value: "1020" },
    { label: "Waiting Approval 2 (Cash in Advance)", value: "1021" },
    { label: "Waiting Accounting Verification (Cash in Advance)", value: "1030" },
    { label: "Approved (Cash in Advance)", value: "1040" },
    {
      label: "SAP Document Created (Cash in Advance)",
      value: "1050",
    },
    { label: "Paid (Cash in Advance)", value: "1060" },
    { label: "Initial (Disbursement)", value: "2010" },
    { label: "Waiting Approval 1 (Disbursement)", value: "2020" },
    { label: "Waiting Approval 2 (Disbursement)", value: "2021" },
    { label: "Waiting Accounting Verification (Disbursement)", value: "2030" },
    { label: "Approved (Disbursement)", value: "2040" },
    {
      label: "SAP Document Created (Disbursement)",
      value: "2050",
    },
    { label: "Paid (Disbursement)", value: "2060" },
    { label: "Deleted by User", value: "3010" },
    { label: "Rejected by Admin", value: "3020" },
  ];

  const statusWithNoOptions = [
    { label: "Initial", value: "010" },
    { label: "Waiting Approval 1", value: "020" },
    { label: "Waiting Approval 2", value: "021" },
    { label: "Waiting Accounting Verification", value: "030" },
    { label: "Approved", value: "040" },
    {
      label: "SAP Document Created",
      value: "050",
    },
    { label: "Paid", value: "060" },
    { label: "Deleted by User", value: "3010" },
    { label: "Rejected by Admin", value: "3020" },
  ];

  const getSpecialRoleTypes = () => {
    if (!role) return [];

    const roleTypes = role.map(
      (r: Role) => r.user_type
    );
    const specialRoles = [];

    if (roleTypes.some((r) => r.startsWith("VD")))
      specialRoles.push("VD");
    if (roleTypes.some((r) => r.startsWith("VG")))
      specialRoles.push("VG");
    if (roleTypes.some((r) => r.startsWith("VA")))
      specialRoles.push("VA");

    return specialRoles;
  };

  const handleDotsTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    setSearchInputs((prev) => ({
      ...prev,
      user_type: value === "All" ? "" : value,
    }));
  };

  // Function to convert role types to status groups
  const getStatusGroupFromRoles = (roleTypes: string[]) => {
    return roleTypes
      .map((roleType) => {
        switch (roleType) {
          case "VD":
            return "VerifiedDH";
          case "VG":
            return "VerifiedGH";
          case "VA":
            return "VerifiedAccounting";
          default:
            return "";
        }
      })
      .filter((status) => status !== "");
  };

  const hasSpecialRole = () => {
    return getSpecialRoleTypes().length > 0;
  };

  const handleSearch = () => {
    if (searchInputs.start_date && !searchInputs.end_date) {
      setErrorMessage("End Date harus diisi jika Start Date sudah dipilih.");
      return;
    }

    const specialRoles = getSpecialRoleTypes();
    const statusGroup = hasSpecialRole()
      ? getStatusGroupFromRoles(specialRoles)
      : [];

    const updatedSearchInputs = { ...searchInputs };

    if (hasSpecialRole()) {
      if (updatedSearchInputs.status_description === "Assign to Me") {
        delete updatedSearchInputs.status_description;
        const searchParamsWithGroup = {
          ...updatedSearchInputs,
          status_group: statusGroup,
        };
        setAppliedSearchParams(searchParamsWithGroup);
      } else {
        const searchParamsWithGroup = {
          ...updatedSearchInputs,
        };
        delete updatedSearchInputs.status_group;
        setAppliedSearchParams(searchParamsWithGroup);
      }
    }else{
      setAppliedSearchParams(updatedSearchInputs);
    }

    setErrorMessage("");
  };

  const getDefaultStatus = (formType: string) => {
    if (!formType && hasSpecialRole()) {
      const specialRoles = getSpecialRoleTypes();
      return {
        statusDescription: undefined,
        statusGroup: getStatusGroupFromRoles(specialRoles),
      };
    }

    return {
      statusDescription: "",
      statusGroup: undefined,
    };
  };

  const handleInputChange = (
    name:string, value:string
  ) => {
    if (name === "form_type") {
      const { statusDescription, statusGroup } = getDefaultStatus(value);

      setSearchInputs((prev) => ({
        ...prev,
        [name]: value,
        category: "",
        status_description: value === "" ? statusDescription : "",
        status_group: value === "" ? statusGroup : undefined,
      }));
    } else if (name === "status_description") {
      if (value === "Assign to Me" && hasSpecialRole()) {
        const specialRoles = getSpecialRoleTypes();
        const statusGroups = getStatusGroupFromRoles(specialRoles);
        setSearchInputs((prev) => ({
          ...prev,
          [name]: value,
          status_group: statusGroups,
        }));
      } else {
        setSearchInputs((prev) => ({
          ...prev,
          [name]: value,
          status_group: undefined,
        }));
      }
    } else {
      setSearchInputs((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const getFilteredStatusOptions = (formType: string) => {
    const filteredOptions = [{ label: "All", value: "" }];
    if (!formType) {
      if (hasSpecialRole()) {        
        filteredOptions.push({
          label: "Assign to Me",
          value: "Assign to Me",
        });
        
      }
      return [...filteredOptions, ...statusWithNoOptions];
    } else {
      if (hasSpecialRole()) {
        
        filteredOptions.push({
          label: "Assign to Me",
          value: "Assign to Me",
        });
        
      }
      const additionalOptions = statusOptions
        .filter((option) => {
          if (formType === "C") {
            return (
              option.label.includes("Cash in Advance") ||
              option.label === "Deleted by User" ||
              option.label === "Rejected by Admin"
            );
          } else if (formType === "R") {
            return (
              option.label.includes("Disbursement") ||
              option.label === "Deleted by User" ||
              option.label === "Rejected by Admin"
            );
          }
          return false;
        })
        .map((option) => ({
          label: option.label.replace(/ \((Cash in Advance|Disbursement)\)/g, ""),
          value: option.value,
        }));
      return [...filteredOptions, ...additionalOptions];
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  console.log(role, 'roles anda');


  if (!user) {
    return <Loading />;
  }
  
  return (
    <Layout>
      <div className="px-1 md:px-16">
        <div className="border-b border-gray-200 pb-5">
          <div className="mt-2 md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl/7 font-bold text-gray-800">
                List Non Insurance Transaction
              </h2>
            </div>
            <div className="mt-4 flex shrink-0 md:ml-4 md:mt-0">
              <button
                onClick={() => router.push("/create")}
                className="ml-auto flex items-center gap-x-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <svg
                  className="-ml-1.5 size-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  data-slot="icon"
                >
                  <path d="M10.75 6.75a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" />
                </svg>
                Create New Dots
              </button>
            </div>
          </div>
        </div>
        {/** Filters */}
        <div className="my-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            {/* First Row */}
            <div>
              <div className="mt-4">
                <label className="block text-sm text-black mb-2">
                  Dots Number
                </label>
                <input
                  type="text"
                  name="dots_number"
                  value={searchInputs.dots_number}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                  placeholder="Enter Dots Number"
                  className="p-2 w-full border rounded-md text-sm text-black"
                />
              </div>
            </div>

            <div>
              <div className="mt-4">
                <label className="block text-sm text-black mb-2">
                  Purpose
                </label>
                <input
                  type="text"
                  name="purpose"
                  value={searchInputs.purpose}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                  placeholder="Enter Purpose"
                  className="p-2 w-full text-sm text-black border rounded-md"
                />
              </div>
            </div>

            <div>
              <div className="mt-4">
                <label className="block text-sm text-black mb-2">
                  Employee Name
                </label>
                <input
                  type="text"
                  name="employee_name"
                  value={searchInputs.employee_name}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                  placeholder="Enter Employee Name"
                  className="p-2 text-sm text-black w-full border rounded-md"
                />
              </div>
            </div>

            <div>
              <div className="mt-4">
                <label className="block text-sm text-black mb-2">
                  Form Type
                </label>
                <select
                  name="form_type"
                  value={searchInputs.form_type}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                  className="p-2 text-sm w-full border rounded-md"
                >
                  {formTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="mt-4">
                <label className="block text-sm text-black mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={searchInputs.category}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                  className="p-2 w-full border rounded-md text-sm text-black"
                  disabled={!searchInputs.form_type}
                >
                  <option value="">Select Category</option>
                  {searchInputs.form_type &&
                    categoryOptions[
                      searchInputs.form_type as keyof typeof categoryOptions
                    ]?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Expandable section */}
            <div 
              className={`md:col-span-5 transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-full opacity-100' : 'max-h-0 opacity-0 md:max-h-full md:opacity-100'
              } overflow-hidden`}
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Status */}
                <div>
                  <div className="mt-4">
                    <label className="block text-sm text-black mb-2">Status</label>
                    <select
                      name="status_description"
                      value={
                        getFilteredStatusOptions(searchInputs.form_type).some(
                          (option) => option.value === searchInputs.status_description
                        )
                          ? searchInputs.status_description
                          : getFilteredStatusOptions(searchInputs.form_type).find(
                              (option) => option.label === "Assign to Me"
                            )?.value || 
                            getFilteredStatusOptions(searchInputs.form_type)[0].value
                      }
                      onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                      className="p-2 w-full border rounded-md text-sm text-black"
                    >
                      {getFilteredStatusOptions(searchInputs.form_type).map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* Date Criteria */}
                <div>
                  <div className="mt-4">
                    <label className="block text-sm text-black mb-2">
                      Date Criteria
                    </label>
                    <select
                      name="date_criteria"
                      value={searchInputs.date_criteria}
                      onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                      className="p-2 w-full border rounded-md text-sm text-black"
                    >
                      <option value="created_date">By Create Date</option>
                      <option value="start_date">By Start Date</option>
                      <option value="end_date">By End Date</option>
                    </select>
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <div className="mt-4">
                    <label className="block text-sm text-black mb-2">
                      Start Date
                    </label>
                    <Datepicker
                      options={options}
                      onChange={handleStartDate}
                      show={showStartDate}
                      setShow={handleCloseStartDate}
                      classNames="bg-white"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <div className="mt-4">
                    <label className="block text-sm text-black mb-2">
                      End Date
                    </label>
                    <Datepicker
                      options={options}
                      onChange={handleEndDate}
                      show={showEndDate}
                      setShow={handleCloseEndDate}
                      classNames="bg-white"
                    />
                  </div>
                </div>

                {/* Dots Type */}
                <div>
                  <div className="mt-4">
                    <label
                      htmlFor="dots-type"
                      className="block text-sm font-sm text-black"
                    >
                      Dots Type
                    </label>
                    <select
                      id="dots-type"
                      className="mt-1 text-sm text-black block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={searchInputs.user_type || "All"}
                      onChange={handleDotsTypeChange}
                    >
                      <option value="All">All</option>
                      <option value="Employee">Employee</option>
                      <option value="Vendor">Vendor</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile expand/collapse button */}
        <div 
          className={`md:hidden transition-all duration-300 ease-in-out flex justify-center ${
            isExpanded ? 'mt-4' : 'mt-0'
          }`}
        >
          <button
            type="button"
            onClick={toggleExpand}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-transform duration-300"
          >
            {isExpanded ? (
              <>
                <span className="mr-1">Show Less</span>
                <ChevronUp className="transition-transform duration-300" size={20} />
              </>
            ) : (
              <>
                <span className="mr-1">Show More</span>
                <ChevronDown className="transition-transform duration-300" size={20} />
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="text-red-500 mb-4">{errorMessage}</div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSearch}
            className="bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 text-white font-bold py-2 px-4 rounded-md mb-4"
          >
            Search
          </Button>
        </div>

        {/** Table */}
        <div className="overflow-x-auto">
          {isInitialized && user ? (
            <InteractiveTable
              searchParams={appliedSearchParams}
              role={role}
              initialPayload={user}
              costCenterApproval={costCenterApproval}
            />
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading user data...</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ShowPage;