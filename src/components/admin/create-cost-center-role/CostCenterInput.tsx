import { useState, useRef } from 'react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label"
import axios from 'axios';

interface CostCenterData {
  cost_center: string;
  cost_center_name: string;
}

interface CostCenterFormProps {
  formData: {
    BUKRS: string;
    user_role: string;
    cost_center: string;
    assigned_cost_center: string;
    create_by: string | undefined;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    BUKRS: string;
    user_role: string;
    cost_center: string;
    assigned_cost_center: string;
    create_by: string | undefined;
  }>>;
  isCostCenterDisabled: boolean;
}

const CostCenterForm: React.FC<CostCenterFormProps> = ({
  formData,
  setFormData,
  isCostCenterDisabled
}) => {
  const BpmsEndPoint = process.env.NEXT_PUBLIC_BPMS_BE_END_POINT;
  const [searchCostCenter, setSearchCostCenter] = useState('');
  const [searchAssignedCenter, setSearchAssignedCenter] = useState('');
  const [isLoadingCostCenter, setIsLoadingCostCenter] = useState(false);
  const [isLoadingAssignedCenter, setIsLoadingAssignedCenter] = useState(false);
  const [costCenterResults, setCostCenterResults] = useState<CostCenterData[]>([]);
  const [assignedCenterResults, setAssignedCenterResults] = useState<CostCenterData[]>([]);
  const [isCostCenterOpen, setIsCostCenterOpen] = useState(false);
  const [isAssignedCenterOpen, setIsAssignedCenterOpen] = useState(false);
  
  const costCenterButtonRef = useRef<HTMLButtonElement>(null);
  const assignedCenterButtonRef = useRef<HTMLButtonElement>(null);

  const searchCostCenterData = async (search: string, isAssigned: boolean) => {
    const setLoading = isAssigned ? setIsLoadingAssignedCenter : setIsLoadingCostCenter;
    const setResults = isAssigned ? setAssignedCenterResults : setCostCenterResults;
    
    setLoading(true);
    try {
      const response = await axios.get(`${BpmsEndPoint}/cost-center?cost_center_name=${search}`);
      const data = await response.data;
      if (data) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching cost center:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string, isAssigned: boolean) => {
    if (isAssigned) {
      setSearchAssignedCenter(value);
    } else {
      setSearchCostCenter(value);
    }
    searchCostCenterData(value, isAssigned);
  };

  const handleCostCenterSelect = (item: CostCenterData, isAssigned: boolean) => {
    if (isAssigned) {
      setFormData(prev => ({
        ...prev,
        assigned_cost_center: item.cost_center,
      }));
      setIsAssignedCenterOpen(false);
      setSearchAssignedCenter('');
    } else {
      setFormData(prev => ({
        ...prev,
        cost_center: item.cost_center,
      }));
      setIsCostCenterOpen(false);
      setSearchCostCenter('');
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Cost Center */}
      <div className="space-y-2">
        <Label>Cost Center {" "}
          <span className="text-red-500 relative group">
            *
            <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
              Required
            </div>
          </span>
        </Label>
        <Popover 
          open={isCostCenterOpen} 
          onOpenChange={setIsCostCenterOpen}
        >
          <PopoverTrigger asChild>
            <Button
              ref={costCenterButtonRef}
              variant="outline"
              role="combobox"
              aria-expanded={isCostCenterOpen}
              className="w-full justify-between"
            >
              {formData.cost_center || "Search cost center..."}
              {isLoadingCostCenter ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false} className="w-full">
              <CommandInput
                placeholder="Search cost center..."
                value={searchCostCenter}
                onValueChange={(value) => handleSearch(value, false)}
                className="h-9"
              />
              <CommandList>
                {isLoadingCostCenter ? (
                  <CommandItem>Loading...</CommandItem>
                ) : !Array.isArray(costCenterResults) || costCenterResults.length === 0 ? (
                  <CommandEmpty>Cost center data not found.</CommandEmpty>
                ) : (
                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                    {costCenterResults.map((item, index) => (
                      <CommandItem
                        key={`${item.cost_center}-${index}`}
                        onSelect={() => handleCostCenterSelect(item, false)}
                        className="cursor-pointer flex justify-between items-center"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium block truncate">{item.cost_center}</span>
                          <span className="text-gray-600 block truncate">
                            {item.cost_center_name}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Assigned Cost Center */}
      <div className="space-y-2">
        <Label>
          Assigned Cost Center
          {isLoadingAssignedCenter && (
            <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />
          )}
        </Label>
        <Popover 
          open={isAssignedCenterOpen} 
          onOpenChange={setIsAssignedCenterOpen}
        >
          <PopoverTrigger asChild>
            <Button
              ref={assignedCenterButtonRef}
              variant="outline"
              role="combobox"
              aria-expanded={isAssignedCenterOpen}
              className="w-full justify-between"
              disabled={isCostCenterDisabled}
            >
              {formData.assigned_cost_center || "Search assigned cost center..."}
              {isLoadingAssignedCenter ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false} className="w-full">
              <CommandInput
                placeholder="Search assigned cost center..."
                value={searchAssignedCenter}
                onValueChange={(value) => handleSearch(value, true)}
                className="h-9"
                disabled={isCostCenterDisabled}
              />
              <CommandList>
                {isLoadingAssignedCenter ? (
                  <CommandItem>Loading...</CommandItem>
                ) : !Array.isArray(assignedCenterResults) || assignedCenterResults.length === 0 ? (
                  <CommandEmpty>Cost center data not found.</CommandEmpty>
                ) : (
                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                    {assignedCenterResults.map((item, index) => (
                      <CommandItem
                        key={`${item.cost_center}-${index}`}
                        onSelect={() => handleCostCenterSelect(item, true)}
                        className="cursor-pointer flex justify-between items-center"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium block truncate">{item.cost_center}</span>
                          <span className="text-gray-600 block truncate">
                            {item.cost_center_name}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default CostCenterForm;