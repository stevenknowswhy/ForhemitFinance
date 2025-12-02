/**
 * Hook for managing receipt OCR state and auto-population
 */

import { useState, useEffect } from "react";
import type { Id } from "convex/_generated/dataModel";
import type { TransactionType } from "../types";

export interface ReceiptData {
  url: string;
  ocrData?: any;
}

export interface UseReceiptOCRReturn {
  receiptOCRData: any;
  setReceiptOCRData: (data: any) => void;
  isProcessingOCR: boolean;
  setIsProcessingOCR: (processing: boolean) => void;
  autoPopulatedFromReceipt: boolean;
  setAutoPopulatedFromReceipt: (populated: boolean) => void;
  uploadedReceipts: ReceiptData[];
  setUploadedReceipts: (receipts: ReceiptData[]) => void;
  showReceiptUpload: boolean;
  setShowReceiptUpload: (show: boolean) => void;
  createdTransactionId: Id<"transactions_raw"> | null;
  setCreatedTransactionId: (id: Id<"transactions_raw"> | null) => void;
}

export function useReceiptOCR(
  receipts: any[] | undefined,
  transactionType: TransactionType,
  isBusiness: boolean | null,
  title: string,
  amount: string,
  date: string,
  onTitleChange: (title: string) => void,
  onAmountChange: (amount: string) => void,
  onDateChange: (date: string) => void
): UseReceiptOCRReturn {
  const [receiptOCRData, setReceiptOCRData] = useState<any>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [autoPopulatedFromReceipt, setAutoPopulatedFromReceipt] = useState(false);
  const [uploadedReceipts, setUploadedReceipts] = useState<ReceiptData[]>([]);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [createdTransactionId, setCreatedTransactionId] = useState<Id<"transactions_raw"> | null>(null);

  // Check for OCR data in receipts and auto-populate
  useEffect(() => {
    const allReceipts = receipts || uploadedReceipts;
    if (allReceipts && allReceipts.length > 0 && !autoPopulatedFromReceipt && transactionType !== null && isBusiness !== null) {
      const receiptWithOCR = allReceipts.find((r: any) => r.ocrData);
      if (receiptWithOCR && receiptWithOCR.ocrData) {
        const ocrData = receiptWithOCR.ocrData;
        setReceiptOCRData(ocrData);
        
        // Auto-populate fields with subtle animation trigger
        if (ocrData.merchant && !title) {
          onTitleChange(ocrData.merchant);
          // Trigger pulse animation on field
          setTimeout(() => {
            const input = document.querySelector('input[type="text"][value="' + ocrData.merchant + '"]') as HTMLElement;
            if (input) {
              input.classList.add('animate-pulse');
              setTimeout(() => input.classList.remove('animate-pulse'), 1000);
            }
          }, 100);
        }
        if (ocrData.amount !== undefined && !amount) {
          onAmountChange(ocrData.amount.toFixed(2));
        }
        if (ocrData.date && !date) {
          onDateChange(ocrData.date);
        }
        
        setAutoPopulatedFromReceipt(true);
      }
    }
  }, [receipts, uploadedReceipts, autoPopulatedFromReceipt, transactionType, isBusiness, title, amount, date, onTitleChange, onAmountChange, onDateChange]);

  return {
    receiptOCRData,
    setReceiptOCRData,
    isProcessingOCR,
    setIsProcessingOCR,
    autoPopulatedFromReceipt,
    setAutoPopulatedFromReceipt,
    uploadedReceipts,
    setUploadedReceipts,
    showReceiptUpload,
    setShowReceiptUpload,
    createdTransactionId,
    setCreatedTransactionId,
  };
}

