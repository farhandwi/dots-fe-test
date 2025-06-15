import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, ArrowRight } from 'lucide-react'; 
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormData } from '../../types/newDots';
import { Dispatch, SetStateAction } from 'react';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

// Define PropsVendor interface
interface PropsEmployee {
    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>;
    currentStep: number;
    setCurrentStep: (value: number) => void;
    handleBack: (type: string) => void;
}

const TransactionDetail: React.FC<PropsEmployee> = ({
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    handleBack
}) => {

    const [startDisplayDate, setStartDisplayDate] = useState('');
    const [endDisplayDate, setEndDisplayDate] = useState('');
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    
    const formatDisplayDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const getYesterdayDate = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    useEffect(() => {
      setStartDisplayDate(formatDisplayDate(formData.startDate || ''));
      setEndDisplayDate(formatDisplayDate(formData.endDate || ''));
    }, [formData.startDate, formData.endDate]);
    
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedDate = new Date(e.target.value);
      const today = new Date(getCurrentDate());
      today.setHours(0, 0, 0, 0);
    
      if (formData.formType === 'Cash in Advance') {
        if (selectedDate >= today) {
          setFormData?.({ ...formData, startDate: e.target.value });
        } else {
          alert("For Cash in Advance, please select today or a future date");
          setFormData?.({ 
            ...formData, 
            startDate: getCurrentDate(),
            endDate: '' 
          });
        }
      } else if (formData.formType === 'Disbursement') {
        if (selectedDate < today) {
          setFormData?.({ ...formData, startDate: e.target.value });
        } else {
          alert("For Disbursement, please select a date before today");
          setFormData?.({ 
            ...formData, 
            startDate: getYesterdayDate(),
            endDate: '' 
          });
        }
      } else {
        setFormData?.({ ...formData, startDate: e.target.value });
      }
    };
    
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedDate = new Date(e.target.value);
      const today = new Date(getCurrentDate());
      today.setHours(0, 0, 0, 0);
    
      if (formData.formType === 'Cash in Advance') {
        if (selectedDate >= today) {
          setFormData?.({ ...formData, endDate: e.target.value });
        } else {
          alert("For Cash in Advance, please select today or a future date");
          setFormData?.({ 
            ...formData, 
            startDate: '',
            endDate: '' 
          });
        }
      } else if (formData.formType === 'Disbursement') {
        if (selectedDate < today) {
          setFormData?.({ ...formData, endDate: e.target.value });
        } else {
          alert("For Disbursement, please select a date before today");
          setFormData?.({ 
            ...formData, 
            startDate: '',
            endDate: '' 
          });
        }
      } else {
        setFormData?.({ ...formData, endDate: e.target.value });
      }
    };

    const isRequiredFieldsFilled = (): boolean => {
        return !!(
            formData.startDate &&
            formData.endDate 
        );
    };

    const handleNextStep = () => {
        if (isRequiredFieldsFilled()) {
            if(formData.startDate > formData.endDate){
              Swal.fire({
                  title: 'Validation Error',
                  text: "End date cannot be earlier than start date",
                  icon: 'error',
                  confirmButtonText: 'OK',
                  confirmButtonColor: '#3085d6',
                  customClass: {
                      container: 'z-[1400]'
                  }
              });
              setFormData?.({ 
                ...formData, 
                startDate: '', 
                endDate: '' 
              });
              return;
            }else{
              setCurrentStep(currentStep + 1);
            }
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Transaction Details Section */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                <Briefcase className="w-6 h-6 text-blue-500" />
                <span>Transaction Details</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                {/* Form Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form Type{" "}
                    <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                        </div>
                    </span>
                    </label>
                    <Input 
                      value={formData.formType || ''}
                      disabled
                      className="w-full bg-gray-100"
                      required
                    />
                </div>
                {/* Start Date */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date{" "}
                    <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                        </div>
                    </span>
                </label>
                <div className="relative">
                    <input
                      type="text"
                      className="w-full border rounded-md px-3 py-1.5 cursor-pointer bg-white"
                      value={startDisplayDate}
                      placeholder="Select start date"
                      onClick={() => setShowStartDatePicker(prev => !prev)}
                      readOnly
                      required
                    />
                    {showStartDatePicker && (
                    <div className="absolute z-50 w-full">
                        <div className="bg-white border shadow-lg rounded-md p-2">
                        <input
                            type="date"
                            className="w-full"
                            value={formData.startDate || ''}
                            min={formData.formType === 'Cash in Advance' ? getCurrentDate() : undefined}
                            max={formData.formType === 'Disbursement' ? getYesterdayDate() : undefined}
                            onChange={(e) => {
                              handleStartDateChange(e);
                            }}
                            onBlur={() => setShowStartDatePicker(false)}
                        />
                        </div>
                    </div>
                    )}
                </div>
                </div>
                {/* Memo Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Memo Number</label>
                    <Input 
                    placeholder="Enter memo number" 
                    className="w-full"
                    value={formData.memoNumber || ''}
                    onChange={(e) => setFormData({ ...formData, memoNumber: e.target.value })}
                    />
                </div>
                </div>
                <div className="space-y-4">
                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category{" "}
                    <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                        </div>
                    </span>
                    </label>
                    <Input 
                      value={formData.category || ''}
                      disabled
                      className="w-full bg-gray-100"
                      required
                    />
                </div>
                {/* End Date */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date{" "}
                    <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                        Required
                        </div>
                    </span>
                </label>
                <div className="relative">
                    <input
                        type="text"
                        className="w-full border rounded-md px-3 py-1.5 cursor-pointer bg-white"
                        value={endDisplayDate}
                        placeholder="Select end date"
                        onClick={() => setShowEndDatePicker(prev => !prev)}
                        readOnly
                        required
                    />
                    {showEndDatePicker && (
                    <div className="absolute z-50 w-full">
                        <div className="bg-white border shadow-lg rounded-md p-2">
                        <input
                            type="date"
                            className="w-full"
                            value={formData.endDate || ''}
                            min={formData.formType === 'Cash in Advance' ? getCurrentDate() : undefined}
                            max={formData.formType === 'Disbursement' ? getYesterdayDate() : undefined}
                            onChange={(e) => {
                              handleEndDateChange(e);
                            }}
                            onBlur={() => setShowEndDatePicker(false)}
                        />
                        </div>
                    </div>
                    )}
                </div>
                </div>
                {/* Memo Link */}
                <div className="flex space-x-2">
                    <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Memo Link</label>
                    <Input 
                        placeholder="Enter memo link"
                        value={formData.memoLink?formData.memoLink:''}
                        onChange={(e) => setFormData({ ...formData, memoLink: e.target.value })}
                    />
                    </div>
                    <Button variant="outline" className="mt-6">
                    <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
                </div>
            </CardContent>
            </Card>
            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
                <Button 
                    variant="outline"
                    onClick={() => handleBack('transactionDetail')}
                    className="flex items-center space-x-2 hover:bg-gray-100"
                >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    <span>Back</span>
                </Button>
                <Button 
                    onClick={handleNextStep}
                    disabled={!isRequiredFieldsFilled()}
                    className={`flex items-center space-x-2 ${
                        isRequiredFieldsFilled() 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-gray-300 cursor-not-allowed text-gray-500'
                    }`}
                >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}


export default TransactionDetail;