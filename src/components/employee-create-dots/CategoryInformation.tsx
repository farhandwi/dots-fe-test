import { Check } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormData } from '../../types/newDots';
import { Dispatch, SetStateAction } from 'react';
import React from 'react';

const CashInAdvanceCategory = [
    {
        label: 'Business Event',
        value: 'Business Event',
        description: 'Apply for funds for business activities such as meetings, workshops or other company events'
    },
    {
        label: 'Business Trip',
        value: 'Business Trip',
        description: 'Funds for business travel including transportation, accommodation and other related costs'
    },
];
  
const DisbursementCategory = [
    {
        label: 'Reimbursement',
        value: 'Reimbursement',
        description: 'Reimbursement of expenses incurred by employees for company purposes'
    },
    {
        label: 'Compensation & Benefit',
        value: 'Compensation & Benefit',
        description: 'Payments related to employee compensation and benefits'
    },
    {
        label: 'Cash Card',
        value: 'Cash Card',
        description: 'Apply for funds to top up company cash cards'
    },
    {
        label: 'Corporate Card',
        value: 'Corporate Card',
        description: 'Company-issued credit card for authorized business expenses, travel, and procurement purposes'
    }
];

// Define PropsVendor interface
interface PropsVendor {
    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>;
    setCurrentStep: (value: number) => void;
    setCategory: (value: string) => void;
    handleBack: (type: string) => void;
}

const CategoryInformation: React.FC<PropsVendor> = ({
    formData,
    setFormData,
    setCurrentStep,
    setCategory,
    handleBack
}) => {

    const updateCategoryData = (value: string) => {
        setCategory(value); 
        setFormData({
            ...formData,
            category: value,
        });
        setCurrentStep(3);
    };


    const filteredCategory = formData.formType === 'Disbursement'
    ? DisbursementCategory
    : formData.formType === 'Cash in Advance'
    ? CashInAdvanceCategory
    : [];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="max-w-4xl mx-auto">
                <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Select Category</CardTitle>
                    <CardDescription>
                    Choose the appropriate category for your operational request
                    </CardDescription>
                </CardHeader>
                <CardContent className='text-center items-center'>
                    <div className="md:flex gap-4 justify-center mb-9 grid grid-cols-1">
                    {filteredCategory.map((category) => (
                        <Card
                        key={category.value}
                        className={`cursor-pointer md:w-1/3 transition-all hover:shadow-lg items-center ${
                            formData.category === category.value
                            ? 'border-2 border-primary'
                            : 'border'
                        }`}
                        onClick={() => updateCategoryData(category.value)}
                        >
                        <CardHeader className="relative">
                            <CardTitle className="text-base">{category.label}</CardTitle>
                            {formData.category === category.value && (
                            <div className="absolute top-1 right-3">
                                <Check className="h-5 w-5 text-primary" />
                            </div>
                            )}
                            <CardDescription className="text-sm mt-2">
                            {category.description}
                            </CardDescription>
                        </CardHeader>
                        </Card>
                    ))}
                    </div>
                    
                    <div className="flex justify-between mt-6">
                    <Button 
                        variant="outline"
                        onClick={() => handleBack('category')}
                        className="flex items-center space-x-2"
                    >
                        Back
                    </Button>
                    </div>
                </CardContent>
                </Card>
            </div>
        </div>
    )
}


export default CategoryInformation;