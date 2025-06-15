import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, ArrowRight } from 'lucide-react'; 
import { Input } from '@/components/ui/input';
import { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { FormData } from '../../types/newDots';
import React, { useState, useEffect } from 'react';

interface PropsVendor {
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>; 
  currentStep: number;
  setCurrentStep: (value: number) => void;
  handleBack: (type: string) => void;
}

const TransactionDetailVendor: React.FC<PropsVendor> = ({
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
        formData.endDate &&
        formData.invoiceNumber
    );
  };

  const handleNextStep = () => {
    if (isRequiredFieldsFilled()) {
        if(formData.startDate > formData.endDate){
          alert("End date cannot be earlier than start date");
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

    return(
        <div>
            {/* Transaction Details Section */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                    <Briefcase className="w-6 h-6 text-blue-500" />
                    <span>Transaction Details</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number{" "}
                        <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                            Required
                        </div>
                        </span>
                    </label>
                    <Input placeholder="Enter invoice number" className="w-full" onChange={(e) => setFormData((prev)=>({ ...prev, invoiceNumber: e.target.value }))} value={formData.invoiceNumber?formData.invoiceNumber:''} required/>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Memo Number</label>
                        <Input placeholder="Enter memo number" className="w-full" value={formData.memoNumber?formData.memoNumber:''} onChange={(e) => setFormData((prev)=>({ ...prev, memoNumber: e.target.value }))}/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Memo Link</label>
                        <div className="flex space-x-2">
                        <Input placeholder="Enter memo link" className="w-full" value={formData.memoLink?formData.memoLink:''} onChange={(e) => setFormData((prev)=>({ ...prev, memoLink: e.target.value }))}/>
                        <Button variant="outline" className="flex-shrink-0">
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                        </div>
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

export default TransactionDetailVendor;