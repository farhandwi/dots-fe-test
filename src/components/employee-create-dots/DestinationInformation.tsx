import React from 'react';
import { Check, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormData } from '../../types/newDots';
import { Dispatch, SetStateAction } from 'react';

const DestinationScopeCategories = [
    {
        label: 'Domestic',
        value: 'domestic',
        description: 'Transactions within the same country, local business operations'
    },
    {
        label: 'International',
        value: 'international',
        description: 'Cross-border transactions involving multiple countries'
    }
];

const RegionGroupCategories = [
    {
        label: 'UK/US/Europe',
        value: 'uk_us_europe',
        description: 'Transactions in major Western economic regions'
    },
    {
        label: 'Others',
        value: 'others',
        description: 'Transactions in other international regions'
    }
];

const DOMESTIC_ONLY_CATEGORIES = [
    'Compensation & Benefit',
    'Reimbursement',
    'Cash Card',
    'Corporate Card',
    'Business Event'
];

interface DestinationScopeProps {
    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>;
    dotsType: string | null;
    currentStep: number;
    setCurrentStep: (value: number) => void;
    handleBack: (type: string) => void;
}

const DestinationScopeVendorSelection: React.FC<DestinationScopeProps> = ({
    formData,
    setFormData,
    dotsType,
    currentStep,
    setCurrentStep,
    handleBack
}) => {
    const [showRegionOptions, setShowRegionOptions] = React.useState(false);

    const isDomesticOnly = DOMESTIC_ONLY_CATEGORIES.includes(formData.category || '');

    React.useEffect(() => {
        if (isDomesticOnly && !formData.destination_scope) {
            setFormData(prev => ({
                ...prev,
                destination_scope: 'domestic',
                region_group: ''
            }));
        }
    }, [formData.category, isDomesticOnly]);

    const handleCardClick = (value: string) => {
        if (isDomesticOnly) {
            if (value === 'domestic') {
                setFormData(prev => ({
                    ...prev,
                    destination_scope: 'domestic',
                    region_group: ''
                }));
                setCurrentStep(currentStep + 1);
            }
            return;
        }

        if (value === 'domestic') {
            setFormData({
                ...formData,
                destination_scope: value,
                region_group: ""
            });
            setCurrentStep(currentStep + 1);
        } else {
            setFormData({
                ...formData,
                destination_scope: value
            });
            setShowRegionOptions(true);
        }
    };

    const updateRegionGroup = (value: string) => {
        setFormData({
            ...formData,
            region_group: value
        });
        setCurrentStep(currentStep + 1);
    };

    const handleRegionBack = () => {
        setShowRegionOptions(false);
        setFormData({
            ...formData,
            destination_scope: "",
            region_group: ""
        });
    };

    const categoriesToShow = showRegionOptions 
        ? RegionGroupCategories 
        : DestinationScopeCategories;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="max-w-4xl mx-auto">
                <Card className="mb-4">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CardTitle>
                                {showRegionOptions 
                                    ? 'Select Region Group' 
                                    : 'Select Destination Scope'}
                            </CardTitle>
                            {isDomesticOnly && (
                                <div className="relative group">
                                    <HelpCircle className="h-5 w-5 text-gray-400" />
                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block">
                                        <div className="bg-black text-white text-xs rounded-md p-2 whitespace-nowrap">
                                            This category only allows domestic transactions
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <CardDescription>
                            {showRegionOptions 
                                ? 'Choose the specific international region for your transaction' 
                                : 'Specify whether your transaction is domestic or international'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='text-center items-center'>
                        <div className="md:flex gap-4 justify-center mb-9 grid grid-cols-1">
                            {categoriesToShow.map((category) => {
                                const isDisabled = isDomesticOnly && category.value === 'international';
                                
                                return (
                                    <Card
                                        key={category.value}
                                        className={`
                                            md:w-1/3 transition-all items-center 
                                            ${isDisabled 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'cursor-pointer hover:shadow-lg'
                                            }
                                            ${(showRegionOptions 
                                                ? formData.region_group 
                                                : formData.destination_scope) === category.value
                                                ? 'border-2 border-primary'
                                                : 'border'
                                            }
                                        `}
                                        onClick={() => {
                                            if (!isDisabled) {
                                                showRegionOptions 
                                                    ? updateRegionGroup(category.value)
                                                    : handleCardClick(category.value);
                                            }
                                        }}
                                    >
                                        <CardHeader className="relative">
                                            <CardTitle className="text-base">{category.label}</CardTitle>
                                            {((showRegionOptions 
                                                ? formData.region_group 
                                                : formData.destination_scope) === category.value) && (
                                                <div className="absolute top-1 right-3">
                                                    <Check className="h-5 w-5 text-primary" />
                                                </div>
                                            )}
                                            <CardDescription className="text-sm mt-2">
                                                {category.description}
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                );
                            })}
                        </div>
                        
                        <div className="flex justify-between mt-6">
                            {dotsType !== 'vendor' && (
                                <>
                                    {showRegionOptions ? (
                                        <Button 
                                            variant="outline"
                                            onClick={handleRegionBack}
                                            className="flex items-center space-x-2"
                                        >
                                            Back
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="outline"
                                            onClick={() => handleBack('destinationInformation')}
                                            className="flex items-center space-x-2"
                                        >
                                            Back
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DestinationScopeVendorSelection;