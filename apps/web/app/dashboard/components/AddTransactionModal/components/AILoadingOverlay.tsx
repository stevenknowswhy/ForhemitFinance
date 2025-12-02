/**
 * AILoadingOverlay Component
 * Full-screen overlay shown when AI is processing suggestions
 */

"use client";

import { Loader2 } from "lucide-react";

interface AILoadingOverlayProps {
  isVisible: boolean;
}

export function AILoadingOverlay({ isVisible }: AILoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
      <div className="bg-card border border-border rounded-lg p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              AI is thinking...
            </h3>
            <p className="text-sm text-muted-foreground">
              Analyzing your transaction and generating suggestions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

