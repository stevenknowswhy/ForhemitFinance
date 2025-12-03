/**
 * Hook for managing transaction submission state
 */

import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";

export interface UseTransactionSubmissionReturn {
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  saveAndAddAnother: boolean;
  setSaveAndAddAnother: (save: boolean) => void;
  showSaveSuccess: boolean;
  setShowSaveSuccess: (show: boolean) => void;
}

export function useTransactionSubmission(): UseTransactionSubmissionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  return {
    isSubmitting,
    setIsSubmitting,
    saveAndAddAnother,
    setSaveAndAddAnother,
    showSaveSuccess,
    setShowSaveSuccess,
  };
}

