/**
 * Swipeable Entry Item Component
 */

"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSwipeable } from "react-swipeable";
import { EntryPreview } from "../../EntryPreview";
import { SwipeableEntryItemProps } from "../types";

export function SwipeableEntryItem({
  entry,
  isSelected,
  swipeState,
  onApprove,
  onReject,
  onEdit,
  onToggleSelect,
  alternatives,
  onSwipeUpdate,
}: SwipeableEntryItemProps) {
  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      const { dir, deltaX } = eventData;
      if (dir === 'Left' || dir === 'Right') {
        onSwipeUpdate(dir.toLowerCase() as 'left' | 'right', Math.abs(deltaX));
      }
    },
    onSwipedLeft: () => {
      onSwipeUpdate(null, 0);
      onReject();
    },
    onSwipedRight: () => {
      onSwipeUpdate(null, 0);
      onApprove();
    },
    onSwiped: () => {
      // Reset swipe state after swipe completes
      onSwipeUpdate(null, 0);
    },
    trackMouse: false, // Only track touch
    trackTouch: true,
    delta: 50, // Minimum distance to trigger swipe
    preventScrollOnSwipe: true,
  });

  const swipeDelta = swipeState?.delta || 0;
  const swipeDirection = swipeState?.direction;

  return (
    <div
      {...swipeHandlers}
      className={cn(
        "relative transition-transform duration-200 ease-out",
        swipeDirection === 'right' && swipeDelta > 50 && "translate-x-4",
        swipeDirection === 'left' && swipeDelta > 50 && "-translate-x-4"
      )}
    >
      {/* Swipe indicator - Approve (right swipe) */}
      {swipeDirection === 'right' && swipeDelta > 30 && (
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-green-600 rounded-l-lg flex items-center justify-center z-10">
          <Check className="w-6 h-6 text-white" />
        </div>
      )}

      {/* Swipe indicator - Reject (left swipe) */}
      {swipeDirection === 'left' && swipeDelta > 30 && (
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-600 rounded-r-lg flex items-center justify-center z-10">
          <X className="w-6 h-6 text-white" />
        </div>
      )}

      {/* Entry Preview with selection checkbox */}
      <div className={cn(
        "relative",
        isSelected && "ring-2 ring-primary"
      )}>
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            aria-label={`Select entry ${entry._id}`}
          />
        </div>
        <div className={cn(isSelected && "ml-10")}>
          <EntryPreview
            entryId={entry._id}
            debitAccountName={entry.debitAccount?.name || "Unknown"}
            creditAccountName={entry.creditAccount?.name || "Unknown"}
            amount={entry.amount}
            explanation={entry.explanation || "No explanation available"}
            confidence={entry.confidence || 0.5}
            memo={entry.memo}
            alternatives={alternatives}
            onApprove={onApprove}
            onReject={onReject}
            onEdit={onEdit}
          />
        </div>
      </div>
    </div>
  );
}

