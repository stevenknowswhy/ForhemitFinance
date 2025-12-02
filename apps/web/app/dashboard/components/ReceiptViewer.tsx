"use client";

/**
 * ReceiptViewer Component
 * Displays uploaded receipts for a transaction
 */

import { useState, useEffect, useCallback } from "react";
import { X, Image as ImageIcon, Download, ChevronLeft, ChevronRight, Loader2, FileText } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { cn } from "@/lib/utils";
import { Id } from "convex/_generated/dataModel";

interface ReceiptViewerProps {
  transactionId: Id<"transactions_raw">;
  initialIndex?: number;
  onClose: () => void;
}

export function ReceiptViewer({ transactionId, initialIndex = 0, onClose }: ReceiptViewerProps) {
  const receipts = useQuery(api.transactions.getReceiptsByTransaction, { transactionId });
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoading, setImageLoading] = useState(true);

  // Get the file URL (support both new fileUrl and legacy storageUrl)
  const getFileUrl = (receipt: any) => {
    return receipt.fileUrl || receipt.storageUrl || "";
  };

  // Check if receipt is an image
  const isImage = (receipt: any) => {
    const mimeType = receipt.mimeType || "";
    return mimeType.startsWith("image/");
  };

  // Navigation functions - defined early so they can be used in useEffect
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        setImageLoading(true);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (receipts && prev < receipts.length - 1) {
        setImageLoading(true);
        return prev + 1;
      }
      return prev;
    });
  }, [receipts]);

  // Keyboard navigation - must be called before any early returns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToPrevious, goToNext]);

  if (receipts === undefined) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-foreground">Loading receipts...</span>
          </div>
        </div>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Receipts</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No receipts uploaded for this transaction</p>
          </div>
        </div>
      </div>
    );
  }

  const currentReceipt = receipts[currentIndex];
  const hasMultiple = receipts.length > 1;

  const handleDownload = () => {
    const fileUrl = getFileUrl(currentReceipt);
    const link = document.createElement("a");
    link.href = fileUrl;
    const filename = currentReceipt.originalFilename || `receipt-${currentReceipt._id}`;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentFileUrl = getFileUrl(currentReceipt);
  const currentIsImage = isImage(currentReceipt);

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw] rounded-md bg-neutral-950/90 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80 transition-colors"
        >
          ✕
        </button>

        {/* Navigation buttons */}
        {hasMultiple && currentIndex > 0 && (
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80 transition-colors"
            title="Previous receipt (←)"
          >
            ◀
          </button>
        )}

        {hasMultiple && currentIndex < receipts.length - 1 && (
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80 transition-colors"
            title="Next receipt (→)"
          >
            ▶
          </button>
        )}

        <div className="flex flex-col gap-2">
          {/* Header with file info */}
          <div className="text-xs text-neutral-200">
            <div className="font-semibold truncate">
              {currentReceipt.originalFilename || `Receipt ${currentIndex + 1}`}
            </div>
            <div className="text-[10px] text-neutral-400">
              {new Date(currentReceipt.uploadedAt).toLocaleString()} • {currentReceipt.mimeType || "image/jpeg"}
              {currentReceipt.sizeBytes && ` • ${(currentReceipt.sizeBytes / 1024).toFixed(1)} KB`}
            </div>
            {hasMultiple && (
              <div className="text-[10px] text-neutral-400 mt-1">
                {currentIndex + 1} of {receipts.length}
              </div>
            )}
          </div>

          {/* Content area */}
          <div className="flex items-center justify-center min-h-[50vh]">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            
            {currentIsImage ? (
              <img
                src={currentFileUrl}
                alt={currentReceipt.originalFilename || `Receipt ${currentIndex + 1}`}
                className={cn(
                  "max-h-[70vh] max-w-[80vw] object-contain rounded-lg",
                  imageLoading && "opacity-0"
                )}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            ) : (
              <iframe
                src={currentFileUrl}
                title={currentReceipt.originalFilename || `Receipt ${currentIndex + 1}`}
                className="h-[70vh] w-[80vw] rounded-lg"
                onLoad={() => setImageLoading(false)}
              />
            )}
          </div>

          {/* Download button */}
          <div className="flex justify-center">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-md bg-black/60 text-xs text-white hover:bg-black/80 transition-colors flex items-center gap-1"
              title="Download receipt"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {hasMultiple && (
          <div className="mt-4 pt-4 border-t border-neutral-700">
            <div className="flex items-center gap-2 overflow-x-auto">
              {receipts.map((receipt: any, index: number) => {
                const thumbUrl = getFileUrl(receipt);
                const thumbIsImage = isImage(receipt);
                
                return (
                  <button
                    key={receipt._id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setImageLoading(true);
                    }}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                      index === currentIndex
                        ? "border-primary scale-105"
                        : "border-neutral-600 hover:border-primary/50 opacity-70 hover:opacity-100"
                    )}
                  >
                    {thumbIsImage ? (
                      <img
                        src={thumbUrl}
                        alt={`Receipt thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        <FileText className="w-6 h-6 text-neutral-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

