import React from 'react';
import { PropsEmployee} from '@/types/newDots';

const EmployeeForm: React.FC<PropsEmployee> = ({
    formData,
    currentStep,
    renderStepEmployeeIndicator,
    renderInitialStep,
    renderDestinationStep,
    renderTransactionDetail,
    renderEmployeeInformation,
    renderAdditionalInformation,
    renderPaymentInformation,
    renderFinishEmployee,
    renderCategoryStep,
    renderCostCenterStep,
    renderPaymentSpecialInformation
  }) => {
    
    return (
      <div className="container mx-auto pt-0 px-4 py-8 max-w-6xl pb-20">
        {renderStepEmployeeIndicator()}
        
        {currentStep === 1 && renderInitialStep()}
        {currentStep === 2 && renderCategoryStep()}
        {currentStep === 3 && renderDestinationStep()}
        {currentStep === 4 && renderCostCenterStep()}
        {currentStep === 5 && renderEmployeeInformation()}
        {(currentStep === 6 && (formData.category === 'Cash Card' || formData.category === 'Corporate Card')) ? renderPaymentSpecialInformation() : (currentStep === 6) && renderPaymentInformation()}
        {currentStep === 7 && renderTransactionDetail()}
        {currentStep === 8 && renderAdditionalInformation()}
        {currentStep === 9 && renderFinishEmployee()}
        
      </div>
    );
  };

export default EmployeeForm;