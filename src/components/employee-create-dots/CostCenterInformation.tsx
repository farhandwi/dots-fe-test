import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormData } from '../../types/newDots';
import React, { useState, useEffect, useMemo } from 'react';
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
import { CostCenter } from '../../types/newDots';
import { Dispatch, SetStateAction } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useAxiosJWT } from '@/hooks/useAxiosJwt';
import { useRouter } from "next/navigation";

interface DecodedToken {
    exp: number;
}

interface ApiResponse {
    status: string;
    data: CostCenterData[];
}

interface CostCenterData {
    cost_center: string;
    cost_center_name: string;
}

interface CostCenterRes {
    cost_center: string;
    cost_center_name: string;
}


interface Role {
    bp: string;
    cost_center: string | null;
    em_cost_center: string | null;
    user_type: string;
}

interface Application {
    application_id: number;
    app_name: string;
    alias: string;
    url: string;
    is_active: number;
    role: Role[];
}

type User = {
    partner: string;
    email: string;
    application: Application[];
};

interface PropsVendor {
    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>;
    user: User | null;
    isLoading: boolean;
    currentStep: number;
    setCurrentStep: (value: number) => void;
    setCostCenter: (value: string) => void;
    handleBack: (type: string) => void;
}

const CostCenterInformation: React.FC<PropsVendor> = ({
    formData,
    setFormData,
    user,
    isLoading,
    currentStep,
    setCurrentStep,
    setCostCenter,
    handleBack
}) => {
    const [costCenterData, setCostCenterData] = useState<CostCenter[] | null>([]);
    const [inputterCostCenters, setInputterCostCenters] = useState<string[]>([]);
    const [selectedInputterCostCenter, setSelectedInputterCostCenter] = useState<string>('');
    const [isInputterSelection, setIsInputterSelection] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [isValidatingInputter, setIsValidatingInputter] = useState(true);
    const [isInitializing, setIsInitializing] = useState(true);
    const [costCenterDescriptions, setCostCenterDescriptions] = useState<Map<string, string>>(new Map());
    const [isLoadingDescriptions, setIsLoadingDescriptions] = useState(false);
    
    const router = useRouter();
    const [isTokenLoading, setIsTokenLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [expire, setExpire] = useState<number | null>(null);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const APIEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;
    const BpmsEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;

    function getRolesByApplicationName(
        applications: Application[] | undefined,
        targetName: string
    ): Role[] | null {
        const app = applications?.find((app) => app.app_name === targetName);
        return app ? app.role : null;
    }

    const checkIS001WithNullCostCenter = () => {
        const targetName = "DOTS";
        const roleDots = getRolesByApplicationName(user?.application, targetName);
        if (!roleDots) return false;

        const filteredRoles = selectedInputterCostCenter
            ? roleDots.filter(role => role.em_cost_center === selectedInputterCostCenter)
            : roleDots;

        return filteredRoles.some(role => 
            role.user_type === 'IS001' && role.cost_center === null
        );
    };

    const fetchCostCenterDescription = async (costCenter: string) => {
        try {
            const response = await axios.get(
                `${BpmsEndpoint}/cost-center?cost_center=${costCenter}`
            );
    
            if (response.status === 200 && response.data.length > 0) {
                const rawDescription = response.data[0].cost_center_name;
                const cleanedDescription = rawDescription
                    .trim()
                    .replace(/\s+/g, " ");
                return cleanedDescription;
            }
            return "No description available";
        } catch (error) {
            console.error('Error fetching cost center description:', error);
            return "Failed to load description";
        }
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
                router.push('/');
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
        const validateInputter = async () => {
            try {
                setIsValidatingInputter(true);
                setIsInitializing(true);
                
                if (user && !isLoading && !isTokenLoading) {
                    const targetName = "DOTS";
                    const roleDots = getRolesByApplicationName(user?.application, targetName);
                    
                    if (roleDots) {
                        const uniqueInputterCostCenters = Array.from(new Set(
                            roleDots
                                .map(role => role.em_cost_center)
                                .filter((center): center is string => center !== null)
                        ));

                        if (uniqueInputterCostCenters.length > 1) {
                            setIsInputterSelection(true);
                            setInputterCostCenters(uniqueInputterCostCenters);

                            setIsLoadingDescriptions(true);

                            const descriptions = new Map<string, string>();
                            
                            await Promise.all(
                                uniqueInputterCostCenters.map(async (center) => {
                                    const description = await fetchCostCenterDescription(center);
                                    descriptions.set(center, description);
                                })
                            );
                            
                            setCostCenterDescriptions(descriptions);
                            setIsLoadingDescriptions(false);
                        } else {
                            await fetchCostCenters(uniqueInputterCostCenters[0] || null);
                        }
                    }
                }
            } catch (error) {
                console.error('Error validating inputter:', error);
            } finally {
                setIsValidatingInputter(false);
                setIsInitializing(false);
            }
        };
        
        validateInputter();
    }, [user, isLoading, token]);

    useEffect(() => {
        if (checkIS001WithNullCostCenter() && searchValue) {
            handleIS001Search(searchValue);
        }
        
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchValue]);

    const handleIS001Search = async (searchTerm: string) => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const newTimeout = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `${BpmsEndpoint}/cost-center?cost_center_name=${searchTerm}`
                );
                if (response.data.length > 0 && Array.isArray(response.data)) {
                    const transformedData = response.data.map((item: any) => ({
                        cost_center: item.cost_center,
                        cost_center_name: item.cost_center_name
                    }));
                    setCostCenterData(transformedData);
                }else{
                    setCostCenterData([]);
                }
            } catch (error) {
                console.error('Error fetching search results:', error);
            } finally {
                setLoading(false);
            }
        }, 500);

        setSearchTimeout(newTimeout);
    };

    const fetchCostCenters = async (selectedEmCostCenter: string | null) => {
        try {
            setLoading(true);
    
            const targetName = "DOTS";
            const roleDots = getRolesByApplicationName(user?.application, targetName);
    
            if (!roleDots) return;
            
            const filteredRoles = selectedEmCostCenter
                ? roleDots.filter(role => role.em_cost_center === selectedEmCostCenter)
                : roleDots;
    
            const hasIS001WithNullCostCenter = filteredRoles.some(role => 
                role.user_type === 'IS001' && role.cost_center === null
            );

            const allCostCenterData: CostCenter[] = [];
    
            if (hasIS001WithNullCostCenter) {
                try {
                    const response = await axios.get(`${BpmsEndpoint}/cost-center`);
                    if (response.data && Array.isArray(response.data)) {
                        response.data.forEach((costCenterData: any) => {
                            const transformedData: CostCenter = {
                                cost_center: costCenterData.cost_center,
                                cost_center_name: costCenterData.cost_center_name
                            };
                            allCostCenterData.push(transformedData);
                        });
                    }
                } catch (error) {
                    console.error('Error fetching all cost centers:', error);
                }
            } else {
                const eligibleRoles = filteredRoles.filter(role => 
                    (role.user_type === 'IC001' || role.user_type === 'IS001') && 
                    role.cost_center !== null
                );
                
                for (const role of eligibleRoles) {
                    try {
                        const response = await axios.get<ApiResponse>(
                            `${BpmsEndpoint}/cost-center?cost_center=${role.cost_center}`
                        );
        
                        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                            
                            const costCenterData = response.data[0];
                            const transformedData: CostCenterRes = {
                                cost_center: costCenterData.cost_center,
                                cost_center_name: costCenterData.cost_center_name
                            };

        
                            if (!allCostCenterData.some(item => item.cost_center === transformedData.cost_center)) {
                                allCostCenterData.push(transformedData);
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching cost center for ${role.cost_center}:`, error);
                        continue;
                    }
                }
            }
   
            setCostCenterData(allCostCenterData);
    
        } catch (error) {
            console.error('Error fetching cost centers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputterCostCenterSelect = (centerId: string) => {
        setSelectedInputterCostCenter(centerId);
        fetchCostCenters(centerId);
        setIsPopoverOpen(false);
    };

    const filteredCostCenters = useMemo(() => {
        if (!searchValue.trim() || checkIS001WithNullCostCenter()) {
            return costCenterData;
        }
        
        return costCenterData?.filter((center) =>
            center.cost_center_name.toLowerCase().includes(searchValue.toLowerCase()) ||
            center.cost_center.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [searchValue, costCenterData]);

    const handleCostCenterSelect = (centerId: string, centerDescription: string) => {
        if (!centerId || !centerDescription) return;
        setCostCenter(centerId);
        setFormData({
            ...formData,
            costCenter: centerId,
            costCenterDesc: centerDescription,
            costCenterInputter: selectedInputterCostCenter
        });
        setIsPopoverOpen(false);
        setCurrentStep(currentStep + 1);
    };

    const renderCostCenterSelections = () => {
        const showInputterSelection = isInputterSelection && inputterCostCenters.length > 0;
        
        return (
            <div className="space-y-6">
                {showInputterSelection && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Cost Center Inputter</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isPopoverOpen}
                                        className="w-full justify-between"
                                    >
                                        {selectedInputterCostCenter 
                                            ? `${selectedInputterCostCenter} - ${costCenterDescriptions.get(selectedInputterCostCenter) || '...'}`
                                            : "Select inputter cost center..."}
                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent 
                                    className="w-[var(--radix-popover-trigger-width)] p-0" 
                                    align="start"
                                >
                                    <Command>
                                        <CommandList>
                                            <CommandGroup>
                                                {(isLoadingDescriptions) ? (
                                                    <>
                                                    {inputterCostCenters.length === 0 ? (
                                                        <>
                                                            <CommandItem>
                                                                <div className="flex items-center justify-center w-full py-2">
                                                                    <span className="ml-2">No Cost Center Found</span>
                                                                </div>
                                                            </CommandItem>
                                                        </>
                                                    ):(
                                                        <CommandItem>
                                                            <div className="flex items-center justify-center w-full py-2">
                                                                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-900"></div>
                                                                <span className="ml-2">Loading descriptions...</span>
                                                            </div>
                                                        </CommandItem>
                                                    )}
                                                    </>
                                                ) : (
                                                    inputterCostCenters.map((center) => (
                                                        <CommandItem
                                                            key={center}
                                                            onSelect={() => handleInputterCostCenterSelect(center)}
                                                            className="cursor-pointer py-3 px-4 hover:bg-gray-100 max-h-[8vh]"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{center}</span>
                                                                <span className="text-sm text-gray-600">
                                                                    {costCenterDescriptions.get(center) || 'Loading...'}
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
                        </CardContent>
                    </Card>
                )}

                {/* Employee Cost Center Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select Cost Center Employee</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {showInputterSelection && !selectedInputterCostCenter ? (
                            <Alert>
                                <AlertDescription>
                                    Please select a Cost Center Inputter first to proceed with employee cost center selection.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Popover 
                                open={employeePopoverOpen} 
                                onOpenChange={setEmployeePopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={employeePopoverOpen}
                                        className="w-full justify-between min-h-[40px]"
                                        disabled={showInputterSelection && !selectedInputterCostCenter}
                                    >
                                        <span className="truncate">
                                            {formData.costCenter
                                                ? costCenterData?.find(center => center.cost_center === formData.costCenter)?.cost_center_name
                                                : "Select employee cost center..."}
                                        </span>
                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command shouldFilter={false} className="w-full">
                                        <CommandInput
                                            placeholder="Search cost center..."
                                            value={searchValue}
                                            onValueChange={setSearchValue}
                                            className="h-9"
                                        />
                                        <CommandList>
                                            <CommandEmpty>No cost center found.</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                                                {(loading || isTokenLoading) ? (
                                                    <>
                                                    <CommandItem>
                                                        <div className="flex items-center justify-center w-full py-2">
                                                            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-900"></div>
                                                            <span className="ml-2">Loading...</span>
                                                        </div>
                                                    </CommandItem>
                                                    </>
                                                ) : (
                                                    filteredCostCenters?.map((center) => (
                                                        <CommandItem
                                                            key={center.cost_center}
                                                            onSelect={() => handleCostCenterSelect(center.cost_center, center.cost_center_name)}
                                                            className="cursor-pointer py-3 px-4 hover:bg-gray-100 max-h-[8vh]"
                                                        >
                                                            <div className="flex flex-col w-full overflow-hidden">
                                                                <span className="font-medium truncate">{center.cost_center}</span>
                                                                <span className="text-sm text-gray-600 truncate">
                                                                    {center.cost_center_name.trim()}
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
                        )}

                        <div className="flex justify-between mt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (selectedInputterCostCenter) {
                                        setSelectedInputterCostCenter('');
                                        setCostCenterData([]);
                                    } else {
                                        handleBack('costCenter');
                                    }
                                }}
                                className="flex items-center space-x-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    if (isTokenLoading || isInitializing) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-6">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                        <p className="text-sm text-gray-600">Validating cost center access...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="max-w-xl mx-auto">
                {isValidatingInputter ? (
                    <Card>
                        <CardContent className="flex items-center justify-center py-6">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                                <p className="text-sm text-gray-600">Validating cost center access...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    renderCostCenterSelections()
                )}
            </div>
        </div>
    );
};

export default CostCenterInformation;