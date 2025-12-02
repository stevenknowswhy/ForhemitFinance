/**
 * Hook for fetching alternatives for low confidence entries
 */

import { useEffect, useMemo, useState } from "react";
import { useAction } from "convex/react";
import { api } from "convex/_generated/api";

export function useAlternatives(
  pendingEntries: any[] | undefined,
  accounts: any[] | undefined
) {
  const getAlternatives = useAction(api.ai_entries.getAlternativeSuggestions);
  const [alternativesCache, setAlternativesCache] = useState<Record<string, any[]>>({});

  // Memoize low confidence entries to avoid unnecessary recalculations
  const lowConfidenceEntries = useMemo(() => {
    if (!pendingEntries) return [];
    return pendingEntries.filter(
      (entry: any) => (entry.confidence || 0) < 0.7 && entry.transactionId && !alternativesCache[entry._id]
    );
  }, [pendingEntries, alternativesCache]);

  // Fetch alternatives for entries with low confidence (debounced to avoid excessive calls)
  useEffect(() => {
    if (!lowConfidenceEntries.length || !accounts) return;

    // Debounce to avoid fetching for every entry simultaneously
    const timeoutId = setTimeout(() => {
      const fetchAlternatives = async () => {
        for (const entry of lowConfidenceEntries) {
          if (!entry.transactionId) continue; // Skip if no transaction ID
          try {
            const result = await getAlternatives({ transactionId: entry.transactionId });
            if (result && result.alternatives) {
              // Map alternatives to include account names
              // Note: Account IDs from getAlternativeSuggestions are strings, need to match with Convex IDs
              const mappedAlternatives = result.alternatives.map((alt: any) => {
                // Convert string IDs to match Convex ID format for comparison
                const debitAcc = accounts.find((a: any) =>
                  a._id === alt.debitAccountId || String(a._id) === String(alt.debitAccountId)
                );
                const creditAcc = accounts.find((a: any) =>
                  a._id === alt.creditAccountId || String(a._id) === String(alt.creditAccountId)
                );
                return {
                  debitAccountId: alt.debitAccountId,
                  creditAccountId: alt.creditAccountId,
                  debitAccountName: debitAcc?.name || "Unknown",
                  creditAccountName: creditAcc?.name || "Unknown",
                  explanation: alt.explanation,
                  confidence: alt.confidence,
                };
              });
              setAlternativesCache((prev) => ({
                ...prev,
                [entry._id]: mappedAlternatives,
              }));
            }
          } catch (error) {
            console.error("Failed to fetch alternatives for entry:", error);
          }
        }
      };

      fetchAlternatives();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [lowConfidenceEntries, accounts, getAlternatives]);

  return { alternativesCache };
}

