import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionNonInsurance } from '@/types/newDots';
import Swal from 'sweetalert2';

interface Currency {
  ref_id: string;
  ref_code: string;
  description: string;
}

interface BankDetail {
  Banka: string;
  Bankl: string;
  Bankn: string;
  Banks: string;
  Bkref: string;
  Bpext: string;
  Koinh: string;
  Mandt: string;
  Partner: string;
}

interface PaymentInformationCardProps {
  formData: TransactionNonInsurance;
  setFormData: React.Dispatch<React.SetStateAction<TransactionNonInsurance>>;
  currencyList: Currency[];
  bankDetails: BankDetail[];
  isLoadingPaymentInfo: boolean;
}

const VendorPaymentInformationCard: React.FC<PaymentInformationCardProps> = ({ 
  formData, 
  setFormData, 
  currencyList, 
  bankDetails,
  isLoadingPaymentInfo 
}) => {
  const [filteredBankDetails, setFilteredBankDetails] = useState<BankDetail[]>([]);
  
  // Reset form data utility function
  const resetFormData = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      curr_id: 'IDR',
      payment_type: 'Transfer',
      employee_acct_bank_number: '',
      employee_bank_name: '',
      employee_acct_bank_name: '',
      remark_payment: ''
    }));
    setFilteredBankDetails([]);
  }, [setFormData]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      resetFormData();
      setFilteredBankDetails([]);
    };
  }, [resetFormData]);

  // Bank details initialization and update
  useEffect(() => {
    if (isLoadingPaymentInfo) return;

    const initializeBankDetails = () => {
      if (!bankDetails || bankDetails.length === 0) {
        Swal.fire({
          title: 'No Bank Details',
          text: 'No bank accounts found for this employee',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          customClass: {
            container: 'z-[1400]'
          }
        });
        resetFormData();
        return;
      }
      const idrBanks = bankDetails.filter(bank => bank.Bkref === 'IDR');
      
      if (idrBanks.length > 0) {
        const defaultIDR = idrBanks[0];
        setFilteredBankDetails(idrBanks);

        setFormData(prev => ({
          ...prev,
          curr_id: 'IDR',
          payment_type: 'Transfer',
          employee_acct_bank_number: defaultIDR.Bankn,
          employee_bank_name: defaultIDR.Koinh,
          employee_acct_bank_name: defaultIDR.Banka
        }));
      } else {
        // If no IDR banks, use the first available bank
        const firstBank = bankDetails[0];
        const sameCurrencyBanks = bankDetails.filter(bank => bank.Bkref === firstBank.Bkref);
        setFilteredBankDetails(sameCurrencyBanks);
        
        setFormData(prev => ({
          ...prev,
          curr_id: firstBank.Bkref,
          payment_type: 'Cash',
          employee_acct_bank_number: firstBank.Bankn,
          employee_bank_name: firstBank.Koinh,
          employee_acct_bank_name: firstBank.Banka
        }));
      }
    };

    initializeBankDetails();
  }, [bankDetails, isLoadingPaymentInfo, resetFormData, setFormData]);

  const handleCurrencyChange = useCallback((currencyId: string) => {
    const filtered = bankDetails.filter(bank => bank.Bkref === currencyId);
    setFilteredBankDetails(filtered);
    const isIDR = currencyId === 'IDR';

    if (filtered.length > 0) {
      const defaultBank = filtered[0];
      setFormData(prev => ({
        ...prev,
        curr_id: currencyId,
        payment_type: isIDR ? 'Transfer' : 'Cash',
        employee_acct_bank_number: defaultBank.Bankn,
        employee_bank_name: defaultBank.Koinh,
        employee_acct_bank_name: defaultBank.Banka
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        curr_id: currencyId,
        payment_type: isIDR ? 'Transfer' : 'Cash',
        employee_acct_bank_number: '',
        employee_bank_name: '',
        employee_acct_bank_name: ''
      }));

      if (isIDR) {
        Swal.fire({
          title: 'Validation Error',
          text: 'Employee must have an IDR bank account',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          customClass: {
            container: 'z-[1400]'
          }
        });
      }
    }
  }, [bankDetails, setFormData]);

  const handleBankAccountChange = useCallback((accountNumber: string) => {
    const selectedBank = filteredBankDetails.find(bank => bank.Bankn === accountNumber);
    if (selectedBank) {
      setFormData(prev => ({
        ...prev,
        employee_acct_bank_number: selectedBank.Bankn,
        employee_bank_name: selectedBank.Koinh,
        employee_acct_bank_name: selectedBank.Banka
      }));
    }
  }, [filteredBankDetails, setFormData]);

  const renderBankAccount = () => {
    if (!bankDetails || bankDetails.length === 0 || filteredBankDetails.length === 0) {
      return (
        <Input 
          value="No available bank account" 
          disabled 
          className="bg-gray-100"
        />
      );
    }

    return (
      <Select
        value={formData.employee_acct_bank_number || ""}
        onValueChange={handleBankAccountChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select bank account">
            {formData.employee_acct_bank_number && filteredBankDetails.length > 0 ? 
              `${filteredBankDetails.find(bank => bank.Bankn === formData.employee_acct_bank_number)?.Banka || ''} - ${formData.employee_acct_bank_number}` : 
              'Select bank account'
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {filteredBankDetails.map((bank: BankDetail) => (
            <SelectItem key={`${bank.Bankn}-${bank.Banka}`} value={bank.Bankn}>
              {bank.Banka} - {bank.Bankn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  if (isLoadingPaymentInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">Loading payment information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPaymentTypeDisabled = Boolean(
    formData.curr_id === 'IDR' || (formData.curr_id && filteredBankDetails.length === 0)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Currency {" "}
              <span className="text-red-500 relative group">
                *
                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                  Required
                </div>
              </span>
            </label>
            <Select
              value={formData.curr_id}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencyList.map((curr: Currency) => (
                  <SelectItem key={curr.ref_code} value={curr.ref_code}>
                    {curr.ref_code} - {curr.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Type {" "}
              <span className="text-red-500 relative group">
                *
                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                  Required
                </div>
              </span>
            </label>
            <Select
              value={formData.payment_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, payment_type: value }))}
              disabled={isPaymentTypeDisabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Block for payment">Block for payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <Input
              type="date"
              className="w-full cursor-not-allowed bg-gray-100"
              value={formData.estimate_payment_due_date}
              disabled
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Payment Details
            {formData.payment_type === 'Cash' && (
              <span className="text-red-500 relative group">
                {' *'}
                <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                  Required
                </div>
              </span>
            )}
          </label>
          <Textarea
            value={formData.remark_payment || ''}
            onChange={e => setFormData(prev => ({ ...prev, remark_payment: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Bank Account
              {formData.payment_type === 'Transfer' && (
                <span className="text-red-500 relative group">
                  {' *'}
                  <div className="absolute left-0 bottom-full mb-1 hidden w-max bg-black text-white text-xs rounded-md px-2 py-1 group-hover:block">
                    Required
                  </div>
                </span>
              )}
            </label>
            {renderBankAccount()}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Account Name</label>
            <Input
              value={formData.employee_acct_bank_name || ''}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bank Name</label>
            <Input
              value={formData.employee_bank_name || ''}
              disabled
              className="bg-gray-100"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorPaymentInformationCard;