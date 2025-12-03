"use client";

import { useState } from "react";
import { Image as ImageIcon, Loader2, Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReceiptOCRData {
  merchant?: string;
  amount?: number;
  date?: string;
  items?: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  tax?: number;
  tip?: number;
  paymentMethod?: string;
  confidence?: number;
}

interface ReceiptPreviewProps {
  receiptUrl: string;
  ocrData?: ReceiptOCRData;
  isProcessing?: boolean;
  onFieldClick?: (field: string, value: any) => void;
  className?: string;
}

export function ReceiptPreview({
  receiptUrl,
  ocrData,
  isProcessing = false,
  onFieldClick,
  className,
}: ReceiptPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.70) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getConfidenceIndicator = (confidence: number) => {
    if (confidence >= 0.85) return "✓";
    if (confidence >= 0.70) return "~";
    return "?";
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Receipt Image */}
      <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center p-4">
              <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load image</p>
            </div>
          </div>
        )}
        <img
          src={receiptUrl}
          alt="Receipt"
          className={cn(
            "w-full h-auto object-contain",
            !imageLoaded && "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Processing receipt... This may take a few seconds.
          </p>
        </div>
      )}

      {/* OCR Results */}
      {ocrData && !isProcessing && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Extracted Information</h4>
            <span
              className={cn(
                "text-xs font-medium",
                getConfidenceColor(ocrData.confidence)
              )}
              title={`Confidence: ${Math.round(ocrData.confidence * 100)}%`}
            >
              {getConfidenceIndicator(ocrData.confidence)} {Math.round(ocrData.confidence * 100)}%
            </span>
          </div>

          <div className="space-y-2 text-sm">
            {/* Merchant */}
            {ocrData.merchant && (
              <div
                className={cn(
                  "p-2 rounded-lg border border-border bg-background",
                  onFieldClick && "cursor-pointer hover:bg-muted transition-colors"
                )}
                onClick={() => onFieldClick?.("merchant", ocrData.merchant)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Merchant:</span>
                  <span className="font-medium text-foreground">{ocrData.merchant}</span>
                </div>
              </div>
            )}

            {/* Amount */}
            {ocrData.amount !== undefined && (
              <div
                className={cn(
                  "p-2 rounded-lg border border-border bg-background",
                  onFieldClick && "cursor-pointer hover:bg-muted transition-colors"
                )}
                onClick={() => onFieldClick?.("amount", ocrData.amount)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium text-foreground">
                    ${ocrData.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Date */}
            {ocrData.date && (
              <div
                className={cn(
                  "p-2 rounded-lg border border-border bg-background",
                  onFieldClick && "cursor-pointer hover:bg-muted transition-colors"
                )}
                onClick={() => onFieldClick?.("date", ocrData.date)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">{ocrData.date}</span>
                </div>
              </div>
            )}

            {/* Line Items */}
            {ocrData.items && ocrData.items.length > 0 && (
              <div className="p-2 rounded-lg border border-border bg-background">
                <div className="text-muted-foreground mb-2">Items:</div>
                <div className="space-y-1">
                  {ocrData.items.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between text-xs",
                        onFieldClick && "cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                      )}
                      onClick={() => onFieldClick?.("item", item)}
                    >
                      <span className="text-foreground">
                        {item.quantity && item.quantity > 1 && `${item.quantity}x `}
                        {item.description}
                      </span>
                      <span className="font-medium text-foreground">
                        ${item.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tax */}
            {ocrData.tax !== undefined && ocrData.tax > 0 && (
              <div
                className={cn(
                  "p-2 rounded-lg border border-border bg-background",
                  onFieldClick && "cursor-pointer hover:bg-muted transition-colors"
                )}
                onClick={() => onFieldClick?.("tax", ocrData.tax)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium text-foreground">
                    ${ocrData.tax.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Tip */}
            {ocrData.tip !== undefined && ocrData.tip > 0 && (
              <div
                className={cn(
                  "p-2 rounded-lg border border-border bg-background",
                  onFieldClick && "cursor-pointer hover:bg-muted transition-colors"
                )}
                onClick={() => onFieldClick?.("tip", ocrData.tip)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tip:</span>
                  <span className="font-medium text-foreground">
                    ${ocrData.tip.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method */}
            {ocrData.paymentMethod && (
              <div className="p-2 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment:</span>
                  <span className="font-medium text-foreground">{ocrData.paymentMethod}</span>
                </div>
              </div>
            )}
          </div>

          {/* Confidence Warning */}
          {ocrData.confidence < 0.70 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  Low confidence extraction
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Please verify the extracted information and make corrections as needed.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

