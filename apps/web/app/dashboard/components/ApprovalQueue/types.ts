/**
 * Type definitions for ApprovalQueue
 */

import { Id } from "convex/_generated/dataModel";

export type SortField = "date" | "amount" | "confidence" | "account";
export type SortOrder = "asc" | "desc";
export type FilterType = "all" | "business" | "personal";
export type ConfidenceFilter = "all" | "high" | "medium" | "low";

export interface ApprovalQueueProps {
  filterType?: FilterType;
}

export interface EditEntryModalProps {
  entry: any;
  accounts: any[];
  onSave: (entryId: Id<"entries_proposed">, edits: any) => void;
  onClose: () => void;
}

export interface SwipeableEntryItemProps {
  entry: any;
  isSelected: boolean;
  swipeState: { direction: 'left' | 'right' | null; delta: number } | undefined;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  onToggleSelect: () => void;
  alternatives: any[];
  onSwipeUpdate: (direction: 'left' | 'right' | null, delta: number) => void;
}

export interface ErrorState {
  entryId: Id<"entries_proposed"> | null;
  message: string;
}

