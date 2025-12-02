/**
 * Constants for AddTransactionModal
 */

export const DEFAULT_DATE = new Date().toISOString().split("T")[0];

export const TOTALS_MATCH_THRESHOLD = 0.01; // Allow 1 cent difference

export const MIN_TITLE_LENGTH = 3;

export const DATE_VALIDATION_DAYS_FUTURE = 30;

export const SPLIT_SUGGESTION_AMOUNT_THRESHOLD = 200;

export const SPLIT_SUGGESTION_MERCHANTS = [
  "costco",
  "amazon",
  "target",
  "walmart",
  "sam's club",
  "sams club",
];

