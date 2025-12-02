/**
 * Hook for managing line items in transaction form
 */

import { useState, useMemo, useCallback } from "react";
import type { LineItem } from "../types";
import { 
  calculateLineItemsTotal, 
  totalsMatch, 
  calculateTotalsDifference 
} from "../utils/calculationHelpers";
import { 
  calculateTotalFromLineItems, 
  getCategoryFromLineItems 
} from "../utils/formHelpers";

export interface UseLineItemsReturn {
  lineItems: LineItem[];
  showItemization: boolean;
  lineItemsTotal: number;
  totalsMatch: boolean;
  totalsDifference: number;
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  updateLineItem: (id: string, field: keyof LineItem, value: string) => void;
  enableItemization: (title: string, amount: string, category: string) => void;
  disableItemization: (onAmountChange: (amount: string) => void, onCategoryChange: (category: string) => void) => void;
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  setShowItemization: (value: boolean) => void;
}

export function useLineItems(
  transactionAmount: string
): UseLineItemsReturn {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showItemization, setShowItemization] = useState(false);

  // Calculate line items total
  const lineItemsTotal = useMemo(() => {
    return calculateLineItemsTotal(lineItems);
  }, [lineItems]);

  // Check if totals match
  const totalAmount = parseFloat(transactionAmount) || 0;
  const totalsMatchResult = totalsMatch(lineItemsTotal, totalAmount);
  const totalsDifferenceResult = calculateTotalsDifference(lineItemsTotal, totalAmount);

  // Add line item
  const addLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: "",
        category: "",
        amount: "",
        tax: "",
        tip: "",
        debitAccountId: "",
        creditAccountId: "",
      },
    ]);
  }, []);

  // Remove line item
  const removeLineItem = useCallback((id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Update line item
  const updateLineItem = useCallback((id: string, field: keyof LineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }, []);

  // Enable itemization mode: create initial line item from current data
  const enableItemization = useCallback(
    (title: string, amount: string, category: string) => {
      if (title && amount && category && lineItems.length === 0) {
        setLineItems([
          {
            id: Date.now().toString(),
            description: title,
            category: category,
            amount: amount,
            tax: "",
            tip: "",
          },
        ]);
      }
      setShowItemization(true);
    },
    [lineItems.length]
  );

  // Disable itemization mode: keep total amount, drop line items
  const disableItemization = useCallback(
    (onAmountChange: (amount: string) => void, onCategoryChange: (category: string) => void) => {
      if (lineItems.length > 0) {
        const total = calculateTotalFromLineItems(lineItems);
        onAmountChange(total);
        const category = getCategoryFromLineItems(lineItems);
        if (category) {
          onCategoryChange(category);
        }
        setLineItems([]);
      }
      setShowItemization(false);
    },
    [lineItems]
  );

  return {
    lineItems,
    showItemization,
    lineItemsTotal,
    totalsMatch: totalsMatchResult,
    totalsDifference: totalsDifferenceResult,
    addLineItem,
    removeLineItem,
    updateLineItem,
    enableItemization,
    disableItemization,
    setLineItems,
    setShowItemization,
  };
}

