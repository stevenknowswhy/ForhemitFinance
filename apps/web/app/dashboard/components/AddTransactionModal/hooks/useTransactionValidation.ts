/**
 * Hook for transaction form validation
 */

import { useState, useCallback } from "react";
import type { LineItem, FormErrors } from "../types";
import { validateTransactionForm } from "../utils/formHelpers";

export interface UseTransactionValidationReturn {
  errors: FormErrors;
  validateForm: (
    title: string,
    amount: string,
    date: string,
    category: string,
    showItemization: boolean,
    lineItems: LineItem[]
  ) => boolean;
  clearErrors: () => void;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
}

export function useTransactionValidation(): UseTransactionValidationReturn {
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = useCallback(
    (
      title: string,
      amount: string,
      date: string,
      category: string,
      showItemization: boolean,
      lineItems: LineItem[]
    ): boolean => {
      const newErrors = validateTransactionForm(
        title,
        amount,
        date,
        category,
        showItemization,
        lineItems
      );
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    []
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateForm,
    clearErrors,
    setErrors,
  };
}

