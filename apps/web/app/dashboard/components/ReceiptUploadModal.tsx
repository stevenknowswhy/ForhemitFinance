"use client";

/**
 * ReceiptUploadModal Component
 * Allows users to upload multiple receipts and associate them with transactions
 */

import { useState } from "react";
import { X, Upload, Image as ImageIcon, Loader2, Check, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import { Id } from "../../../../../convex/_generated/dataModel";

interface ReceiptUploadModalProps {
  onClose: () => void;
  transactionId?: Id<"transactions_raw">; // Optional: if uploading from transaction list
  onUploadComplete?: (receiptUrls: string[]) => void;
}

export function ReceiptUploadModal({
  onClose,
  transactionId,
  onUploadComplete,
}: ReceiptUploadModalProps) {
  const { user } = useUser();
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const createReceipt = useMutation(api.transactions.createReceipt);
  const processReceiptOCR = useAction(api.receipt_ocr.processReceiptOCR);
  const currentUser = useQuery(api.users.getCurrentUser);

  const handleUploadComplete = async (res: Array<{
    url: string;
    name: string;
    serverData?: {
      fileUrl: string;
      fileKey: string;
      originalFilename: string;
      mimeType: string;
      sizeBytes: number;
    };
  }>) => {
    if (!currentUser?._id) {
      setUploadError("User not authenticated");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const receiptUrls: string[] = [];

      // Save each receipt to Convex with enhanced metadata
      for (const file of res) {
        // Extract metadata from UploadThing response
        // Use ufsUrl instead of deprecated url property
        const fileUrl = (file as any).ufsUrl || file.url || (file as any).serverData?.fileUrl;
        const serverData = file.serverData || {
          fileUrl: fileUrl,
          fileKey: fileUrl?.split('/').pop() || '',
          originalFilename: file.name,
          mimeType: 'image/jpeg', // fallback
          sizeBytes: 0,
        };

        const receiptId = await createReceipt({
          userId: currentUser._id,
          transactionId: transactionId,
          fileUrl: serverData.fileUrl,
          fileKey: serverData.fileKey,
          originalFilename: serverData.originalFilename,
          mimeType: serverData.mimeType,
          sizeBytes: serverData.sizeBytes,
          // Legacy support
          storageUrl: serverData.fileUrl,
        });
        receiptUrls.push(serverData.fileUrl);

        // Trigger OCR processing (async, don't wait)
        processReceiptOCR({
          receiptUrl: serverData.fileUrl,
          receiptId: receiptId,
        }).catch((error) => {
          console.error("OCR processing failed:", error);
          // Don't block upload if OCR fails
        });
      }

      setUploadedFiles((prev) => [...prev, ...res]);
      setUploadSuccess(true);
      
      if (onUploadComplete) {
        onUploadComplete(receiptUrls);
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Failed to save receipt:", error);
      setUploadError(error.message || "Failed to save receipt");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    setUploadError(error.message || "Failed to upload receipt");
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Upload Receipts</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {uploadError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Upload Error</p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">{uploadError}</p>
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Upload Successful!</p>
              <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                {uploadedFiles.length} receipt(s) uploaded successfully
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Upload one or more receipt images. You can upload up to 10 receipts at once.
            </p>

            <UploadButton
              endpoint="receiptUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              onUploadBegin={() => {
                setIsUploading(true);
                setUploadError(null);
                setUploadSuccess(false);
              }}
              input={{
                userId: currentUser?._id || '',
                transactionId: transactionId || undefined,
              }}
              content={{
                button: ({ ready }) => (
                  <div className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors w-full",
                    ready
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}>
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Choose Receipts</span>
                      </>
                    )}
                  </div>
                ),
                allowedContent: "Images & PDFs up to 8MB",
              }}
            />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Uploaded Receipts:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                  >
                    <ImageIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{(file as any).ufsUrl || file.url || 'Uploaded'}</p>
                    </div>
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <button
              onClick={onClose}
              disabled={isUploading}
              className={cn(
                "w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium hover:bg-muted transition-colors",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              {uploadSuccess ? "Close" : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

