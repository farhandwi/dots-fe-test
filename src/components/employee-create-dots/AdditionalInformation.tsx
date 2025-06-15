import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react'; 
import { Input } from '@/components/ui/input';
import { FormData } from '../../types/newDots';
import {Textarea} from '@/components/ui/textarea'
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react'; 
import React from 'react';
import { Dispatch, SetStateAction } from 'react';
import PolicyNumberForm from '../PolicyNumber';

// Define PropsVendor interface
interface PropsVendor {
    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>;
    currentStep: number;
    setCurrentStep: (value: number) => void;
    handleBack: (type: string) => void;
}

const AdditionalInformation: React.FC<PropsVendor> = ({
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    handleBack,
}) => {

    const isRequiredFieldsFilled = (): boolean => {
        return !!(
            formData.event &&
            formData.purpose
        );
    };

    const handleNextStep = () => {
        if (isRequiredFieldsFilled()) {
            setCurrentStep(currentStep + 1);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                    <Building className="w-6 h-6 text-blue-500" />
                    <span>Additional Information</span>
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name{" "}
                        <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                            Required
                        </div>
                        </span>
                    </label>
                    <Input placeholder="Enter event name" onChange={(e) => setFormData((prev)=>({ ...prev, event: e.target.value }))} value={formData.event? formData.event : ''} required/>
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <Input placeholder="Enter client name" onChange={(e) => setFormData((prev)=>({ ...prev, clientName: e.target.value }))} value={formData.clientName? formData.clientName : ''}/>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address
                    </label>
                    <Textarea 
                        placeholder="Enter complete address"
                        className="min-h-32"
                        onChange={(e) => setFormData((prev)=>({ ...prev, address: e.target.value }))}
                        value={formData.address? formData.address : ''}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose{" "}
                        <span className="text-red-500 relative group">
                        *
                        <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                            Required
                        </div>
                        </span>
                    </label>
                    <Textarea 
                        placeholder="Enter purpose of transaction"
                        className="min-h-32"
                        onChange={(e) => setFormData((prev)=>({ ...prev, purpose: e.target.value }))}
                        value={formData.purpose? formData.purpose : ''}
                        required
                    />
                </div>

                <PolicyNumberForm
                    formData={formData}
                    setFormData={setFormData}
                />

                </CardContent>
            </Card>
            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
                <Button 
                    variant="outline"
                    onClick={() => handleBack('additionalInformation')}
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

export default AdditionalInformation;