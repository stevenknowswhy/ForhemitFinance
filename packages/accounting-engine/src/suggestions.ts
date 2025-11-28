/**
 * Entry suggestion logic and confidence scoring
 */

import type { TransactionContext, EntrySuggestion } from './engine';

export interface SuggestionContext {
  transaction: TransactionContext;
  historicalMatches?: HistoricalMatch[];
  userPreferences?: {
    defaultCategories?: Record<string, string>;
    businessPercentage?: number;
  };
}

export interface HistoricalMatch {
  merchant?: string;
  category: string;
  accountId: string;
  count: number;
  lastUsed: number;
}

/**
 * Enhance suggestion with historical data and user patterns
 */
export function enhanceSuggestion(
  baseSuggestion: EntrySuggestion,
  context: SuggestionContext
): EntrySuggestion {
  let confidence = baseSuggestion.confidence;
  let explanation = baseSuggestion.explanation;

  // Boost confidence if this matches historical patterns
  if (context.historicalMatches) {
    const historicalMatch = findHistoricalMatch(
      context.transaction,
      context.historicalMatches
    );

    if (historicalMatch) {
      confidence = Math.min(0.98, confidence + 0.15);
      explanation = `${explanation} (You've used this category ${historicalMatch.count} times before)`;
    }
  }

  // Adjust for business vs personal
  if (context.transaction.isBusiness && context.userPreferences?.businessPercentage) {
    // If user typically marks similar transactions as business, boost confidence
    if (context.userPreferences.businessPercentage > 0.7) {
      confidence = Math.min(0.95, confidence + 0.1);
    }
  }

  return {
    ...baseSuggestion,
    confidence,
    explanation,
  };
}

function findHistoricalMatch(
  transaction: TransactionContext,
  historicalMatches: HistoricalMatch[]
): HistoricalMatch | null {
  if (!transaction.merchant) {
    return null;
  }

  // Find exact merchant match
  const exactMatch = historicalMatches.find(
    h => h.merchant?.toLowerCase() === transaction.merchant?.toLowerCase()
  );

  if (exactMatch && exactMatch.count >= 3) {
    return exactMatch;
  }

  // Find category match
  if (transaction.category && transaction.category.length > 0) {
    const categoryMatch = historicalMatches.find(
      h => h.category.toLowerCase() === transaction.category![0].toLowerCase()
    );

    if (categoryMatch && categoryMatch.count >= 5) {
      return categoryMatch;
    }
  }

  return null;
}

/**
 * Calculate confidence score based on multiple factors
 */
export function calculateConfidence(
  suggestion: EntrySuggestion,
  factors: {
    hasMerchantMatch: boolean;
    hasCategoryMatch: boolean;
    hasHistoricalData: boolean;
    hasUserRule: boolean;
  }
): number {
  let confidence = suggestion.confidence;

  if (factors.hasUserRule) {
    confidence = Math.max(confidence, 0.95);
  }

  if (factors.hasMerchantMatch && factors.hasCategoryMatch) {
    confidence = Math.max(confidence, 0.85);
  }

  if (factors.hasHistoricalData) {
    confidence = Math.min(0.98, confidence + 0.1);
  }

  return confidence;
}

