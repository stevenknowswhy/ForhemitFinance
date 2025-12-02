/**
 * Form helper functions for transaction forms
 */

import type { LineItem, FormErrors } from "../types";
import { 
  MIN_TITLE_LENGTH, 
  DATE_VALIDATION_DAYS_FUTURE,
  SPLIT_SUGGESTION_AMOUNT_THRESHOLD,
  SPLIT_SUGGESTION_MERCHANTS
} from "../constants";
import { parseAmount, isValidAmount, calculateLineItemsTotal } from "./calculationHelpers";

/**
 * Validate transaction form fields
 */
export function validateTransactionForm(
  title: string,
  amount: string,
  date: string,
  category: string,
  showItemization: boolean,
  lineItems: LineItem[]
): FormErrors {
  const errors: FormErrors = {};

  if (!title) {
    errors.title = "Where did you spend this?";
  }

  if (!amount) {
    errors.amount = "How much was the total?";
  } else if (!isValidAmount(amount)) {
    errors.amount = "Please enter an amount greater than $0.00";
  }

  if (!date) {
    errors.date = "What day did this happen?";
  } else {
    const dateObj = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + DATE_VALIDATION_DAYS_FUTURE);

    if (dateObj > thirtyDaysFromNow) {
      errors.date = "This date seems to be in the future—mind double-checking?";
    }
  }

  if (!showItemization && !category) {
    errors.category = "Want help choosing a category?";
  }

  // Itemization validation
  if (showItemization) {
    if (lineItems.length === 0) {
      errors.lineItems = "Please add at least one line item to itemize this receipt.";
    } else {
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        if (!item.description.trim()) {
          errors[`lineItem_${i}_description`] = "All line items must have a description.";
        }
        const itemAmount = parseAmount(item.amount);
        if (itemAmount <= 0) {
          errors[`lineItem_${i}_amount`] = "All line items must have a valid amount greater than 0.";
        }
      }
    }
  }

  return errors;
}

/**
 * Check if title is long enough for certain operations
 */
export function isTitleLongEnough(title: string): boolean {
  return title.trim().length >= MIN_TITLE_LENGTH;
}

/**
 * Check if transaction should suggest splitting
 */
export function shouldSuggestSplit(
  title: string,
  amount: string,
  transactionType: "income" | "expense" | null
): boolean {
  if (transactionType !== "expense") {
    return false;
  }

  const amountNum = parseAmount(amount);
  if (amountNum <= 0) {
    return false;
  }

  const titleLower = title.toLowerCase();
  const exceedsAmountThreshold = amountNum > SPLIT_SUGGESTION_AMOUNT_THRESHOLD;
  const matchesMerchant = SPLIT_SUGGESTION_MERCHANTS.some(merchant =>
    titleLower.includes(merchant)
  );

  return exceedsAmountThreshold || matchesMerchant;
}

/**
 * Calculate total from line items and update amount
 */
export function calculateTotalFromLineItems(lineItems: LineItem[]): string {
  const total = calculateLineItemsTotal(lineItems);
  return total.toFixed(2);
}

/**
 * Get category from first line item
 */
export function getCategoryFromLineItems(lineItems: LineItem[]): string {
  return lineItems[0]?.category || "";
}

