"use client";

/**
 * ReceiptsGallery Component
 * Displays a thumbnail grid of receipts with click-to-view functionality
 */

import { useState } from "react";
import { Image as ImageIcon, FileText } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { ReceiptViewer } from "./ReceiptViewer";
import { cn } from "@/lib/utils";

type ReceiptDoc = Doc<"receipts">;

interface ReceiptsGalleryProps {
  receipts: ReceiptDoc[];
  transactionId?: Doc<"transactions_raw">["_id"];
}

export function ReceiptsGallery({ receipts, transactionId }: ReceiptsGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!receipts || receipts.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No receipts attached yet.</p>
    );
  }

  // Get the file URL (support both new fileUrl and legacy storageUrl)
  const getFileUrl = (receipt: ReceiptDoc) => {
    return receipt.fileUrl || receipt.storageUrl || "";
  };

  // Check if receipt is an image
  const isImage = (receipt: ReceiptDoc) => {
    const mimeType = receipt.mimeType || "";
    return mimeType.startsWith("image/");
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {receipts.map((receipt: any, idx: number) => {
          const fileUrl = getFileUrl(receipt);
          const image = isImage(receipt);

          return (
            <button
              key={receipt._id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className="relative group aspect-[4/3] overflow-hidden rounded-md border bg-muted hover:border-primary transition-colors"
            >
              {image ? (
                <img
                  src={fileUrl}
                  alt={receipt.originalFilename || `Receipt ${idx + 1}`}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-[10px] px-2">
                  <FileText className="w-6 h-6 mb-1 text-muted-foreground" />
                  <span className="line-clamp-2 text-[10px] text-center">
                    {receipt.originalFilename || "PDF"}
                  </span>
                </div>
              )}
              <span className="absolute bottom-1 left-1 right-1 rounded bg-black/60 px-1 text-[9px] text-white truncate">
                {new Date(receipt.uploadedAt).toLocaleDateString()}
              </span>
            </button>
          );
        })}
      </div>

      {activeIndex !== null && transactionId && (
        <ReceiptViewer
          transactionId={transactionId}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  );
}

