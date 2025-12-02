/**
 * ReceiptSection Component
 * Displays receipt preview and upload button
 */

import { ReceiptPreview } from "../../ReceiptPreview";
import type { ReceiptOCRData } from "../types";

interface ReceiptSectionProps {
  receipts: Array<{ fileUrl?: string; ocrData?: ReceiptOCRData }> | undefined;
  uploadedReceipts: Array<{ url: string; ocrData?: ReceiptOCRData }>;
  isProcessingOCR: boolean;
  onFieldClick: (field: "merchant" | "amount" | "date", value: string | number) => void;
  onUploadClick: () => void;
  showInMobile?: boolean;
}

export function ReceiptSection({
  receipts,
  uploadedReceipts,
  isProcessingOCR,
  onFieldClick,
  onUploadClick,
  showInMobile = false,
}: ReceiptSectionProps) {
  const hasReceipts = (receipts && receipts.length > 0 && receipts[0]) || (uploadedReceipts.length > 0 && uploadedReceipts[0]);

  if (!hasReceipts && !showInMobile) {
    return null;
  }

  return (
    <>
      {/* Receipt Preview Section - Show at top on mobile, right column on desktop */}
      {hasReceipts && (
        <div className={showInMobile ? "mb-4 lg:hidden" : ""}>
          <ReceiptPreview
            receiptUrl={receipts?.[0]?.fileUrl || uploadedReceipts[0]?.url || ""}
            ocrData={receipts?.[0]?.ocrData || uploadedReceipts[0]?.ocrData}
            isProcessing={isProcessingOCR}
            onFieldClick={(field, value) => {
              if (field === "merchant") {
                onFieldClick("merchant", value as string);
              } else if (field === "amount") {
                onFieldClick("amount", value as number);
              } else if (field === "date") {
                onFieldClick("date", value as string);
              }
            }}
          />
        </div>
      )}

      {/* Receipt Upload Button - Only show if no receipts yet */}
      {!hasReceipts && (
        <button
          type="button"
          onClick={onUploadClick}
          className="w-full text-left text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors py-2 flex items-center gap-2 group"
        >
          <span className="group-hover:underline">Need to attach a photo of the receipt?</span>
          {!showInMobile && (
            <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      )}
    </>
  );
}

