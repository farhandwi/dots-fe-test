import React from 'react';
import {PropsVendor} from '@/types/newDots';

const VendorForm: React.FC<PropsVendor> = ({
    currentStep,
    renderStepEmployeeIndicator,
    renderTransactionDetail,
    renderEmployeeInformation,
    renderVendorDestinationInformation,
    renderAdditionalInformation,
    renderPaymentInformation,
    renderFinishVendor,
    renderCostCenterStep,
    renderVendorInformation
  }) => {


    return (
      <div className="container mx-auto pt-0 px-4 py-8 max-w-6xl pb-20">
        {renderStepEmployeeIndicator()}
        
        {currentStep === 1 && renderVendorDestinationInformation()}
        {currentStep === 2 && renderCostCenterStep()}
        {currentStep === 3 && renderEmployeeInformation()}
        {currentStep === 4 && renderVendorInformation()}
        {currentStep === 5 && renderPaymentInformation()}
        {currentStep === 6 && renderTransactionDetail()}
        {currentStep === 7 && renderAdditionalInformation()}
        {currentStep === 8 && renderFinishVendor()}
        
      </div>
    );
  };

export default VendorForm;