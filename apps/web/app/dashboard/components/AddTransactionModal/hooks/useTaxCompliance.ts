/**
 * Hook for managing tax and compliance state
 */

import { useState } from "react";

export interface UseTaxComplianceReturn {
  taxRate: string;
  setTaxRate: (rate: string) => void;
  taxAmount: string;
  setTaxAmount: (amount: string) => void;
  isTaxInclusive: boolean;
  setIsTaxInclusive: (inclusive: boolean) => void;
  isTaxExempt: boolean;
  setIsTaxExempt: (exempt: boolean) => void;
  taxExemptReason: string;
  setTaxExemptReason: (reason: string) => void;
  track1099: boolean;
  setTrack1099: (track: boolean) => void;
}

export function useTaxCompliance(): UseTaxComplianceReturn {
  const [taxRate, setTaxRate] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  const [taxExemptReason, setTaxExemptReason] = useState("");
  const [track1099, setTrack1099] = useState(false);

  return {
    taxRate,
    setTaxRate,
    taxAmount,
    setTaxAmount,
    isTaxInclusive,
    setIsTaxInclusive,
    isTaxExempt,
    setIsTaxExempt,
    taxExemptReason,
    setTaxExemptReason,
    track1099,
    setTrack1099,
  };
}

