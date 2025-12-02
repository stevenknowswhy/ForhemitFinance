/**
 * Calculation helper functions for transaction forms
 */

import type { LineItem } from "../types";
import { TOTALS_MATCH_THRESHOLD } from "../constants";

/**
 * Calculate the total amount from line items (including tax and tip)
 */
export function calculateLineItemsTotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => {
    const itemAmount = parseFloat(item.amount) || 0;
    const itemTax = parseFloat(item.tax) || 0;
    const itemTip = parseFloat(item.tip) || 0;
    return sum + itemAmount + itemTax + itemTip;
  }, 0);
}

/**
 * Check if line items total matches the transaction total amount
 */
export function totalsMatch(
  lineItemsTotal: number,
  transactionTotal: number
): boolean {
  return Math.abs(lineItemsTotal - transactionTotal) < TOTALS_MATCH_THRESHOLD;
}

/**
 * Calculate the difference between line items total and transaction total
 */
export function calculateTotalsDifference(
  lineItemsTotal: number,
  transactionTotal: number
): number {
  return Math.abs(lineItemsTotal - transactionTotal);
}

/**
 * Parse amount string to number, returning 0 if invalid
 */
export function parseAmount(amount: string): number {
  const parsed = parseFloat(amount);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate amount is a positive number
 */
export function isValidAmount(amount: string): boolean {
  const amountNum = parseAmount(amount);
  return !isNaN(amountNum) && amountNum > 0;
}

