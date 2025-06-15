import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remark: string) => Promise<void>;
  dots_number: string;
}

export default function DeleteModal({ isOpen, onClose, onConfirm, dots_number }: DeleteModalProps) {
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!remark.trim()) {
      setError('Please provide a reason for deletion');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onConfirm(remark);
    } catch (error) {
      console.error('Error in delete confirmation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRemark('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Delete Transaction
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
            <p className="text-amber-800 text-sm">
              You are about to delete transaction <span className="font-semibold">{dots_number}</span>. 
              This action cannot be undone.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="remark" className="text-sm font-medium text-gray-700">
              Deletion Reason
            </Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Please provide a reason for deleting this transaction..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete Transaction'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}