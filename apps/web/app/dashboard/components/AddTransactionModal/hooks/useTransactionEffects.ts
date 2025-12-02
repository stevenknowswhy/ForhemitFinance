/**
 * Hook for transaction form effects (keyboard shortcuts, itemization preference)
 */

import { useEffect } from "react";
import { setupKeyboardShortcuts } from "../utils/keyboardShortcuts";

export interface UseTransactionEffectsProps {
  showItemization: boolean;
  setFrequentlyItemizes: (value: boolean) => void;
  setSaveAndAddAnother: (save: boolean) => void;
  onClose: () => void;
}

export function useTransactionEffects({
  showItemization,
  setFrequentlyItemizes,
  setSaveAndAddAnother,
  onClose,
}: UseTransactionEffectsProps) {
  // Update itemization preference when user toggles
  useEffect(() => {
    if (typeof window !== "undefined" && showItemization) {
      // User is itemizing, mark as frequent user
      localStorage.setItem("frequentlyItemizes", "true");
      setFrequentlyItemizes(true);
    }
  }, [showItemization, setFrequentlyItemizes]);

  // Keyboard shortcuts
  useEffect(() => {
    return setupKeyboardShortcuts({
      onSave: () => {
        const form = document.getElementById("transaction-form") as HTMLFormElement;
        form?.requestSubmit();
      },
      onSaveAndAddAnother: () => {
        setSaveAndAddAnother(true);
      },
      onClose,
    });
  }, [onClose, setSaveAndAddAnother]);
}

