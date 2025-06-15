import { useState, useRef, useEffect, SetStateAction, Dispatch } from 'react';
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
import { Search, Loader2, X } from 'lucide-react';
import { Label } from "@/components/ui/label"
import axios from 'axios';
import { FormData } from '@/types/newDots';

interface PolicyData {
    ZZPOL_NBR: string;
}

interface PolicyNumberFormProps {
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
}

const PolicyNumberForm: React.FC<PolicyNumberFormProps> = ({
  formData,
  setFormData,
}) => {
    const [searchPolicy, setSearchPolicy] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [policyResults, setPolicyResults] = useState<PolicyData[]>([]);
    const [isPolicyOpen, setIsPolicyOpen] = useState(false);
    const policyButtonRef = useRef<HTMLButtonElement>(null);
    const [selectedPolicy, setSelectedpolicy] = useState<string>('');
    const searchTimeoutRef = useRef<NodeJS.Timeout>();
    const SapEndPoint = process.env.NEXT_PUBLIC_SAP_END_POINT;

  const fetchInitialPolicies = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${SapEndPoint}/Policy/Acq_Cost?Limit=10&param=`);
      const data = await response.data.data_result;
      if (data) {
        setPolicyResults(data);
      }
    } catch (error) {
      console.error('Error fetching initial policies:', error);
      setPolicyResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchPolicyData = async (search: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${SapEndPoint}/Policy/Acq_Cost?Limit=10&param=${search}`);
      const data = await response.data.data_result;
      if (data) {
        setPolicyResults(data);
      } else {
        setPolicyResults([]);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      setPolicyResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchPolicy(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPolicyData(value);
    }, 300); 
  };

  const handleClearInternalOrder = () => {
    setSelectedpolicy('');
    setFormData(prev => ({
      ...prev,
      policyNumber: ''
    }));
    };

  useEffect(() => {
    fetchInitialPolicies();
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handlePolicySelect = (item: PolicyData) => {
    setFormData(prev => ({
      ...prev,
      policyNumber: item.ZZPOL_NBR,
    }));
    setIsPolicyOpen(false);
    setSelectedpolicy(item.ZZPOL_NBR);
    setSearchPolicy('');
  };

  return (
    <div>
      <Label className="block text-sm font-medium text-gray-700 mb-1">
        Policy Number
        {isLoading && <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />}
      </Label>
      <div className="flex items-center space-x-2">
        <Popover open={isPolicyOpen} onOpenChange={setIsPolicyOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={policyButtonRef}
              variant="outline"
              role="combobox"
              aria-expanded={isPolicyOpen}
              className="w-full justify-between"
            >
              {formData.policyNumber || "Search policy number..."}
              {isLoading ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command shouldFilter={false} className="w-full">
              <CommandInput
                placeholder="Search policy number..."
                value={searchPolicy}
                onValueChange={handleSearch}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>No policy found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-y-auto">
                  {isLoading ? (
                    <CommandItem>Loading...</CommandItem>
                  ) : (
                    policyResults.map((item, index) => (
                      <CommandItem
                        key={`${item.ZZPOL_NBR}-${index}`}
                        onSelect={() => handlePolicySelect(item)}
                        className="cursor-pointer flex justify-between items-center"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium block truncate">
                            {item.ZZPOL_NBR}
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
        {selectedPolicy && (
          <Button
            type="button"
            variant="ghost"
            className="px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleClearInternalOrder}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );  
};

export default PolicyNumberForm;