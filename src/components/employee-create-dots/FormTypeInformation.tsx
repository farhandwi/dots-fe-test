import { Card, CardContent} from '@/components/ui/card';
import {DollarSign, Clock } from 'lucide-react'; 
import { FormData } from '../../types/newDots';
import { Dispatch, SetStateAction } from 'react';
import React from 'react';

// Define PropsVendor interface
interface PropsVendor {
    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>;
    formType: string;
    setFormType: (value: string) => void;
    setCurrentStep: (value: number) => void;
    handleBack: (type: string) => void;
}

const FormTypeInformation: React.FC<PropsVendor> = ({
    formData,
    setFormData,
    formType,
    setFormType,
    setCurrentStep,
    handleBack
}) => {

    const updateFormData = (value: string) => {
        setFormType(value);
        setFormData?.({ 
            ...formData, 
            formType: value, 
        });
        setCurrentStep(2);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto md:flex">
                <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    formData.formType === 'Cash in Advance' ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => updateFormData('Cash in Advance')}
                >
                <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-4">
                    <div className="p-3 rounded-full bg-blue-100">
                        <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Cash in Advance</h3>
                    <p className="text-center text-gray-600 text-sm">
                        Request funds before expenses occur. Ideal for planned purchases, travel advances, or project funds.
                    </p>
                    </div>
                </CardContent>
                </Card>

                <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    formData.formType === 'Disbursement' ? 'ring-2 ring-green-500' : ''
                }`}
                onClick={() => updateFormData('Disbursement')}
                >
                <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-4">
                    <div className="p-3 rounded-full bg-green-100">
                        <Clock className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Disbursement</h3>
                    <p className="text-center text-gray-600 text-sm">
                        Reimburse expenses that have already occurred. Submit receipts and get compensated for approved expenses.
                    </p>
                    </div>
                </CardContent>
                </Card>
            </div>
        </div>
    )
}


export default FormTypeInformation;