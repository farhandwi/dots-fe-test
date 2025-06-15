import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormData, employeeData } from '../../types/newDots';
import React, { useState, useEffect, useMemo } from 'react';
import { Dispatch, SetStateAction } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Search } from 'lucide-react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useAxiosJWT } from '@/hooks/useAxiosJwt';
import Swal from 'sweetalert2';

interface DecodedToken {
    exp: number;
}

interface FormFieldProps {
    label: string;
    required?: boolean;
    value: string;
    type?: 'text' | 'email' | 'number';
    disabled?: boolean;
    className?: string;
}

interface CardData {
    card_no: string;
    bp: string;
    cardholder_name: string;
    bank_name: string;
    category: string;
    valid_from: string;
    valid_to: string | null;
}

interface PropsEmployeeInformation {
    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>;
    currentStep: number;
    setCurrentStep: (value: number) => void;
    setPartner: (value: string) => void;
    handleBack: (type: string) => void;
}

const EmployeeInformation: React.FC<PropsEmployeeInformation> = ({
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    setPartner,
    handleBack
}) => {
    const BpmsEndpoint = process.env.NEXT_PUBLIC_BPMS_BE_END_POINT;
    const DotsEndpoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [employeeData, setEmployeeData] = useState<employeeData[]>([]);
    const [loading, setLoading] = useState(false);
    const [cardData, setCardData] = useState<CardData[]>([]);
    const [filteredEmployees, setFilteredEmployee] = useState<employeeData[]>([])

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
                const response = await axios.get(`${BpmsEndpoint}/token`, { 
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

    useEffect(() => {
        const fetchEmployeeData = async () => {
            if (!formData.costCenter) {
                console.warn("Cost center tidak tersedia atau token sedang dimuat.");
                return;
            }
    
            setLoading(true);
            try {
                const response = await axios.get(`${BpmsEndpoint}/employee?cost_center=${formData.costCenter}`);
                const employees = response.data || [];
                setEmployeeData(employees);
    
                if (!Array.isArray(employees)) {
                    console.error("Data karyawan tidak valid:", employees);
                    setEmployeeData([]);
                    return;
                }
                let validEmployees = [];
                let dataValidEmp = [];
                if (['Cash Card', 'Corporate Card'].includes(formData.category)) {
                    let responseCard = null;
                    if(formData.category === 'Cash Card'){
                        responseCard = await axiosJWT.get(`${DotsEndpoint}/cash-cards/${formData.category}/${formData.costCenter}`);
                    }else if(formData.category === 'Corporate Card'){
                        responseCard = await axiosJWT.get(`${DotsEndpoint}/cash-cards/${formData.category}/NULL`);
                    }
                    const dataCard = responseCard?.data || [];
                    setCardData(dataCard);
        
                    if (!Array.isArray(dataCard)) {
                        console.error("Data kartu tidak valid:", dataCard);
                        setCardData([]);
                        return;
                    }
                    validEmployees = employees.filter((emp) =>
                        dataCard.some((card) => card.bp === emp.partner) && 
                        emp.partner.startsWith('13')
                    );
                    const searchLower = searchValue.toLowerCase();
    
                    if(validEmployees.length > 0){
                        dataValidEmp = validEmployees.filter((emp) =>
                            emp.partner.toLowerCase().includes(searchLower) ||
                            emp.name_first.toLowerCase().includes(searchLower)
                        );
                    }else{
                        await Swal.fire({
                            title: 'Employee Not Found!',
                            text: `The ${formData.category} data for ${formData.costCenterDesc} could not be found for any employee.`,
                            icon: 'error',
                            customClass: {
                                container: 'z-[1400]'
                            }
                        });
                    }
                    setFilteredEmployee(dataValidEmp.length > 0 ? dataValidEmp : []);
                    return;
                }
                const filteredEmployees = employees.filter(emp => emp.partner.startsWith('13'));
                setFilteredEmployee(filteredEmployees);
    
            } catch (error) {
                console.error("Gagal mengambil data:", error);
            } finally {
                setLoading(false);
            }
        };
    
        if (!isTokenLoading) {
            fetchEmployeeData();
        }
    }, [formData.costCenter, formData.category, token, axiosJWT, isTokenLoading]);

    const filteredEmployeeData = useMemo(() => {
        return filteredEmployees?.filter((bp) =>
            bp.cost_center.toLowerCase().includes(searchValue.toLowerCase()) ||
            bp.name_first.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [searchValue, filteredEmployees]);
    

    // Handle employee selection
    const handleEmployeeSelect = (employee: employeeData) => {
        setPartner(employee.partner);
        setFormData({
            ...formData,
            businessPartner: employee.partner,
            employeeName: employee.name_first.trim(),
            employeeNIP: employee.nip.trim(),
            costCenter: employee.cost_center,
            costCenterDesc: employee.division.trim(),
            employeeEmail: employee.email.trim()
        });
        setIsPopoverOpen(false);
    };

    const isRequiredFieldsFilled = (): boolean => {
        return !!(
            formData.businessPartner &&
            formData.employeeNIP &&
            formData.employeeName &&
            formData.employeeEmail
        );
    };

    const handleNextStep = () => {
        if (isRequiredFieldsFilled()) {
            setCurrentStep(currentStep + 1);
        }
    };

    if (isTokenLoading || loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-6">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                        <p className="text-sm text-gray-600">Loading Employee ...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn max-w-[1200px] mx-auto">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-3">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                        <span className="truncate">Employee Information</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Business Partner{" "}
                                    <span className="text-red-500 relative group">
                                        *
                                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block z-50">
                                            Required
                                        </div>
                                    </span>
                                </label>
                                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isPopoverOpen}
                                            className="w-full justify-between min-h-[40px]"
                                        >
                                            <span className="truncate">
                                                {formData.businessPartner 
                                                    ? `${formData.businessPartner} - ${formData.employeeName}`
                                                    : "Select business partner..."}
                                            </span>
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command shouldFilter={false} className="w-full">
                                            <CommandInput
                                                placeholder="Search by ID or name..."
                                                value={searchValue}
                                                onValueChange={setSearchValue}
                                                className="h-9"
                                            />
                                            <CommandList>
                                                <CommandEmpty>No employee found.</CommandEmpty>
                                                <CommandGroup className="max-h-[250px] overflow-y-auto">
                                                    {(loading || isTokenLoading) ? (
                                                        <CommandItem>Loading...</CommandItem>
                                                    ) : filteredEmployeeData.length === 0 ? (
                                                        <CommandItem>No eligible employees found.</CommandItem>
                                                    ) : (
                                                        filteredEmployeeData?.map((emp: employeeData) => (
                                                            <CommandItem
                                                                key={emp.partner}
                                                                onSelect={() => handleEmployeeSelect(emp)}
                                                                className="cursor-pointer hover:bg-gray-100"
                                                            >
                                                                <div className="flex flex-col w-full overflow-hidden">
                                                                    <span className="font-medium truncate">
                                                                        {emp.partner}
                                                                    </span>
                                                                    <span className="text-sm text-gray-600 truncate">
                                                                        {emp.name_first.trim()}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <FormField
                                label="Employee NIP"
                                required
                                value={formData.employeeNIP}
                                disabled
                                className="bg-gray-100"
                            />

                            <FormField
                                label="Cost Center"
                                required
                                value={formData.costCenter}
                                disabled
                                className="bg-gray-100"
                            />
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <FormField
                                label="Employee Name"
                                required
                                value={formData.employeeName}
                                disabled
                                className="bg-gray-100"
                            />

                            <FormField
                                label="Employee Email"
                                required
                                type="email"
                                value={formData.employeeEmail}
                                disabled
                                className="bg-gray-100"
                            />

                            <FormField
                                label="Division"
                                required
                                value={formData.costCenterDesc}
                                disabled
                                className="bg-gray-100"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between mt-4 sm:mt-8">
                <Button 
                    variant="outline"
                    onClick={() => handleBack('employeeInformation')}
                    className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 sm:px-4"
                >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    <span>Back</span>
                </Button>
                <Button 
                    onClick={handleNextStep}
                    disabled={!isRequiredFieldsFilled()}
                    className={`flex items-center space-x-2 px-3 py-2 sm:px-4 ${
                        isRequiredFieldsFilled() 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-gray-300 cursor-not-allowed text-gray-500'
                    }`}
                >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

const FormField: React.FC<FormFieldProps> = ({ 
    label, 
    required = false, 
    value = '', 
    type = "text", 
    disabled = false, 
    className = '' 
}) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}{" "}
            {required && (
                <span className="text-red-500 relative group">
                    *
                    <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block z-50">
                        Required
                    </div>
                </span>
            )}
        </label>
        <Input
            type={type}
            placeholder={label}
            value={value}
            disabled={disabled}
            className={`${className} truncate`}
        />
    </div>
);

export default EmployeeInformation;