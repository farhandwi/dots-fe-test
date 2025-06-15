import React from 'react';
import { Check } from 'lucide-react';

const STEP_VENDOR_LABELS = [ 
  'Destination Information',
  'Cost Center',
  'Employee\nInformation', 
  'Vendor\nInformation', 
  'Payment\nInformation', 
  'Transaction\nDetail', 
  'Additional\nInformation', 
  'Review'
] as const;

const STEP_EMPLOYEE_LABELS = [
  'Form Type',
  'Category', 
  'Destination Information',
  'Cost Center', 
  'Employee\nInformation', 
  'Payment\nInformation', 
  'Transaction\nDetail', 
  'Additional\nInformation', 
  'Review'
] as const;

const StepIndicator = ({
  step,
  currentStep,
  DotsType
}: {
  step: number;
  currentStep: number;
  DotsType: string | null;
}) => {
  const isStepCompleted = currentStep > step;
  const isStepActive = currentStep >= step;
  const totalSteps = DotsType === 'employee' ? STEP_EMPLOYEE_LABELS.length : STEP_VENDOR_LABELS.length;
  const isLastStep = step === totalSteps;

  return (
    <div className="flex flex-col items-center relative">
      {/* Connector Line */}
      {!isLastStep && (
        <div>
          <div 
            className={`h-full transition-all duration-500 ${
              isStepCompleted ? 'bg-blue-500 w-full' : isStepActive ? 'bg-blue-500 w-1/2' : 'w-0'
            }`}
          />
        </div>
      )}
      
      {/* Circle Indicator */}
      <div
        className={`
          w-8 h-8 rounded-full 
          flex items-center justify-center 
          shadow-sm
          transition-all duration-300 ease-in-out
          transform
          ${isStepCompleted ? 'bg-blue-500 text-white' : 
            isStepActive ? 'bg-blue-500 text-white scale-110' : 
            'bg-white border-2 border-gray-200 text-gray-500'}
        `}
      >
        {isStepCompleted ? (
          <Check className="w-5 h-5 animate-appear" />
        ) : (
          <span className="text-sm font-medium">{step}</span>
        )}
      </div>

      {/* Label */}
      <div
        className={`
        mt-2
        flex items-center justify-center
        text-center
        transition-all duration-300
        ${isStepActive ? 'text-blue-500 font-medium' : 'text-gray-500'}
        text-xs md:text-xs h-8 w-20 md:w-24
        `}
      >
        {(DotsType === 'employee' ? STEP_EMPLOYEE_LABELS : STEP_VENDOR_LABELS)[step - 1]
        .split('\n')
        .map((line, index, array) => (
            <React.Fragment key={index}>
            {line}
            {index < array.length - 1 && <br />}
            </React.Fragment>
        ))}
      </div>
    </div>
  );
};


const StepCreateDotsIndicator = ({ 
    currentStep,
    DotsType
  }: { 
    currentStep: number,
    DotsType: string | null;
  }) => {
        return (  
        <div className="max-w-6xl mx-auto px-0 py-2 mb-6 sm:px-0">
        {/* Steps Grid */}
        <div className={`grid grid-cols-4 md:grid-cols-4 ${DotsType === 'employee' ? 'lg:grid-cols-9' : 'lg:grid-cols-8'}  gap-4 md:gap-4 mb-3`}>
            {(DotsType === 'employee' ? STEP_EMPLOYEE_LABELS : STEP_VENDOR_LABELS).map((_, index) => (
            <StepIndicator
                key={index + 1}
                step={index + 1}
                currentStep={currentStep}
                DotsType={DotsType}
            />
            ))}
        </div>

        {/* Mobile Progress Bar */}
        <div className="mt-3 relative h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500 rounded-full"
            style={{ 
                width: `${(currentStep - 1) * (100 / ((DotsType === 'employee' ? STEP_EMPLOYEE_LABELS : STEP_VENDOR_LABELS).length - 1))}%` 
            }}
            />
        </div>
        </div>
    );
};

export default StepCreateDotsIndicator;