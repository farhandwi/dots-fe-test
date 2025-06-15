import React from 'react';
import { Button } from '@/components/ui/button';

interface ConfirmationModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open, 
  onCancel, 
  onConfirm, 
  title = "Unsaved Changes",
  message = "You have unsaved changes. Are you sure you want to leave this page?"
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black opacity-50"
        onClick={onCancel}
      ></div>
      
      {/* Modal Container */}
      <div className="relative w-auto max-w-lg mx-auto my-6">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-blueGray-200">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button className="rounded-full w-1/12 float-right hover:bg-red-100 focus:bg-red-100 text-gray-500  hover:text-red-600  focus:text-red-600"
              onClick={onCancel}
            >
              X
            </button>
          </div>
          
          {/* Body */}
          <div className="relative flex-auto p-6">
            <p className="my-4 text-lg leading-relaxed text-blueGray-500">
              {message}
            </p>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-solid rounded-b border-blueGray-200">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              className="mr-4"
            >
              Stay on Page
            </Button>
            <Button 
              onClick={onConfirm}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Discard Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;