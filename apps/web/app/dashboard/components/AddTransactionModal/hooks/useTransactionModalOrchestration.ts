/**
 * Master orchestration hook for AddTransactionModal
 * Consolidates all hook initialization and returns everything needed by the component
 */

import { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { LineItem } from "../types";
import { useOrgIdOptional } from "../../../../hooks/useOrgId";
import { useLineItems } from "./useLineItems";
import { useTransactionValidation } from "./useTransactionValidation";
import { useTransactionForm } from "./useTransactionForm";
import { useTransactionAI } from "./useTransactionAI";
import { useReceiptOCR } from "./useReceiptOCR";
import { useTransactionSubmission } from "./useTransactionSubmission";
import { useSplitTransaction, UseSplitTransactionReturn } from "./useSplitTransaction";
import { useSimilarTransactions } from "./useSimilarTransactions";
import { useTaxCompliance } from "./useTaxCompliance";
import { useTransactionAIHandlers } from "./useTransactionAIHandlers";
import { useTransactionSubmissionHandler } from "./useTransactionSubmissionHandler";
import { useTransactionFormHelpers } from "./useTransactionFormHelpers";
import { useTransactionEffects } from "./useTransactionEffects";
import { resetForm as resetFormUtil } from "../utils/resetForm";

export interface UseTransactionModalOrchestrationProps {
  onClose: () => void;
}

export interface UseTransactionModalOrchestrationReturn {
  // Form state
  intent: any;
  setIntent: (intent: any) => void;
  transactionType: "expense" | "income" | null;
  isBusiness: boolean | null;
  title: string;
  setTitle: (title: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  date: string;
  setDate: (date: string) => void;
  category: string;
  setCategory: (category: string) => void;
  description: string;
  setDescription: (description: string) => void;
  note: string;
  setNote: (note: string) => void;
  debitAccountId: string;
  setDebitAccountId: (id: string) => void;
  creditAccountId: string;
  setCreditAccountId: (id: string) => void;
  advancedOpen: boolean;
  setAdvancedOpen: (open: boolean) => void;
  showMoreDetails: boolean;
  setShowMoreDetails: (show: boolean) => void;
  showAccountingPreview: boolean;
  setShowAccountingPreview: (show: boolean) => void;
  completedFields: Set<string>;
  setCompletedFields: React.Dispatch<React.SetStateAction<Set<string>>>;
  frequentlyItemizes: boolean;
  setFrequentlyItemizes: (itemizes: boolean) => void;
  entryMode: "simple" | "itemized";
  hasValidTitle: boolean;

    // Line items
    lineItems: any[];
    showItemization: boolean;
    lineItemsTotal: number;
    totalsMatch: boolean;
    totalsDifference: number;
    addLineItem: () => void;
    removeLineItem: (id: string) => void;
    updateLineItem: (id: string, field: keyof LineItem, value: string) => void;
    enableItemization: () => void;
    disableItemization: () => void;
    setLineItems: React.Dispatch<React.SetStateAction<any[]>>;
    setShowItemization: (show: boolean) => void;


  // Validation
  errors: any;
  validateForm: (
    title: string,
    amount: string,
    date: string,
    category: string,
    showItemization: boolean,
    lineItems: LineItem[]
  ) => boolean;
  clearErrors: () => void;
  setErrors: (updater: (prev: any) => any) => void;

  // AI state
  useAI: boolean;
  setUseAI: (use: boolean) => void;
  autoPopulated: boolean;
  setAutoPopulated: (populated: boolean) => void;
  isAILoading: boolean;
  setIsAILoading: (loading: boolean) => void;
  aiSuggestions: any[] | null;
  setAiSuggestions: (suggestions: any[] | null) => void;
  aiModalDescription: string;
  setAiModalDescription: (description: string) => void;
  lineItemAILoading: Record<string, boolean>;
  setLineItemAILoading: (loading: Record<string, boolean>) => void;
  lineItemAISuggestions: Record<string, any[]>;
  setLineItemAISuggestions: (suggestions: Record<string, any[]>) => void;
  aiSuggestedCategory: string | undefined;
  setAiSuggestedCategory: (category: string | undefined) => void;
  aiCategoryConfidence: number | undefined;
  setAiCategoryConfidence: (confidence: number | undefined) => void;

  // Submission
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  saveAndAddAnother: boolean;
  setSaveAndAddAnother: (save: boolean) => void;
  showSaveSuccess: boolean;
  setShowSaveSuccess: (show: boolean) => void;
  createdTransactionId: Id<"transactions_raw"> | null;
  setCreatedTransactionId: (id: Id<"transactions_raw"> | null) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;

  // Receipt OCR
  receipts: any;
  receiptOCRData: any | null;
  setReceiptOCRData: (data: any) => void;
  isProcessingOCR: boolean;
  setIsProcessingOCR: (processing: boolean) => void;
  autoPopulatedFromReceipt: boolean;
  setAutoPopulatedFromReceipt: (populated: boolean) => void;
  uploadedReceipts: any[];
  setUploadedReceipts: (receipts: any[]) => void;
  showReceiptUpload: boolean;
  setShowReceiptUpload: (show: boolean) => void;

  // Split transaction
  splitHook: UseSplitTransactionReturn;

  // Tax & Compliance
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

  // Similar transactions
  hasSimilarTransaction: boolean;
  similarTransactions: any[] | undefined;

  // Duplicate detection
  duplicateMatch: any;
  duplicateDismissed: boolean;
  setDuplicateDismissed: (dismissed: boolean) => void;

  // Form helpers
  showAIButton: boolean;
  canUseAI: boolean;

  // AI handlers
  handleDoubleEntryAI: () => Promise<void>;
  handleManualAITrigger: (overrideDebitAccountId?: string, overrideCreditAccountId?: string, isAutoTrigger?: boolean) => Promise<void>;
  handleSelectSuggestion: (suggestion: any) => Promise<void>;
  handleLineItemAI: (lineItemId: string, isAutoTrigger?: boolean) => Promise<void>;

  // Itemization handlers
  handleItemizationToggle: (value: boolean) => void;

  // Reset form
  resetForm: () => void;

  // User accounts
  userAccounts: any[] | undefined;
}

export function useTransactionModalOrchestration({
  onClose,
}: UseTransactionModalOrchestrationProps): UseTransactionModalOrchestrationReturn {
  // Use extracted hooks - order matters due to dependencies
  // 1. Form state (provides amount, title, etc.)
  // Note: showItemization will be passed after lineItems hook is initialized
  const [showItemizationState, setShowItemizationState] = useState(false);
  const formHook = useTransactionForm(showItemizationState);
  const {
    intent,
    setIntent,
    transactionType,
    isBusiness,
    title,
    setTitle,
    amount,
    setAmount,
    date,
    setDate,
    category,
    setCategory,
    description,
    setDescription,
    note,
    setNote,
    debitAccountId,
    setDebitAccountId,
    creditAccountId,
    setCreditAccountId,
    advancedOpen,
    setAdvancedOpen,
    showMoreDetails,
    setShowMoreDetails,
    showAccountingPreview,
    setShowAccountingPreview,
    completedFields,
    setCompletedFields,
    frequentlyItemizes,
    setFrequentlyItemizes,
    entryMode,
    hasValidTitle,
  } = formHook;

  // 2. Line items (needs amount from form)
  const lineItemsHook = useLineItems(amount);
  const {
    lineItems,
    showItemization,
    lineItemsTotal,
    totalsMatch: totalsMatchResult,
    totalsDifference,
    addLineItem,
    removeLineItem,
    updateLineItem,
    enableItemization: enableItemizationHook,
    disableItemization: disableItemizationHook,
    setLineItems,
    setShowItemization,
  } = lineItemsHook;

  // Sync showItemization between hooks
  useEffect(() => {
    setShowItemizationState(showItemization);
  }, [showItemization]);

  // 3. Validation
  const validationHook = useTransactionValidation();
  const { errors, validateForm, clearErrors, setErrors } = validationHook;

  // 4. AI state
  const aiHook = useTransactionAI();
  const {
    useAI,
    setUseAI,
    autoPopulated,
    setAutoPopulated,
    isAILoading,
    setIsAILoading,
    aiSuggestions,
    setAiSuggestions,
    aiModalDescription,
    setAiModalDescription,
    lineItemAILoading,
    setLineItemAILoading,
    lineItemAISuggestions,
    setLineItemAISuggestions,
    aiSuggestedCategory,
    setAiSuggestedCategory,
    aiCategoryConfidence,
    setAiCategoryConfidence,
  } = aiHook;

  // 5. Submission state (manages createdTransactionId)
  const submissionHook = useTransactionSubmission();
  const {
    isSubmitting,
    setIsSubmitting,
    saveAndAddAnother,
    setSaveAndAddAnother,
    showSaveSuccess,
    setShowSaveSuccess,
  } = submissionHook;

  // createdTransactionId is set after transaction creation
  const [createdTransactionId, setCreatedTransactionId] = useState<Id<"transactions_raw"> | null>(null);

  // 6. Receipt OCR (needs form values and createdTransactionId)
  // Query receipts for the created transaction
  const receipts = useQuery(
    api.transactions.getReceiptsByTransaction,
    createdTransactionId ? { transactionId: createdTransactionId } : "skip"
  );

  const ocrHook = useReceiptOCR(
    receipts,
    transactionType,
    isBusiness,
    title,
    amount,
    date,
    setTitle,
    setAmount,
    setDate
  );
  const {
    receiptOCRData,
    setReceiptOCRData,
    isProcessingOCR,
    setIsProcessingOCR,
    autoPopulatedFromReceipt,
    setAutoPopulatedFromReceipt,
    uploadedReceipts,
    setUploadedReceipts,
    showReceiptUpload,
    setShowReceiptUpload,
  } = ocrHook;

  // Split transaction logic (extracted to hook)
  const splitHook = useSplitTransaction(
    title,
    amount,
    category,
    transactionType,
    showItemization,
    receiptOCRData,
    enableItemizationHook,
    setLineItems
  );
  const {
    showSplitPrompt,
    splitSuggestions,
    setSplitSuggestions,
    isLoadingSplit,
    showSplitInfoModal,
    setShowSplitInfoModal,
    handleSplitSuggestion,
  } = splitHook;

  // Tax & Compliance state (extracted to hook)
  const taxComplianceHook = useTaxCompliance();
  const {
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
  } = taxComplianceHook;

  // Convex queries and actions
  const { orgId } = useOrgIdOptional();
  const userAccounts = useQuery(api.accounts.getAll, orgId ? { orgId } : "skip");

  // Duplicate detection
  const duplicateMatch = useQuery(
    api.duplicate_detection.findDuplicates,
    title.trim().length >= 3 && amount && transactionType !== null && isBusiness !== null
      ? {
          merchant: title,
          amount: parseFloat(amount) || 0,
          date: date,
        }
      : "skip"
  );
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);

  // Similar transactions and auto-population (extracted to hook)
  const similarTransactionsHook = useSimilarTransactions(
    title,
    transactionType,
    isBusiness,
    category,
    autoPopulated,
    useAI,
    setCategory,
    setAutoPopulated
  );
  const { hasSimilarTransaction, similarTransactions } = similarTransactionsHook;

  // Form effects (extracted to hook)
  useTransactionEffects({
    showItemization,
    setFrequentlyItemizes,
    setSaveAndAddAnother,
    onClose,
  });

  // Enable itemization mode: create initial line item from current data
  const enableItemization = () => {
    enableItemizationHook(title, amount, category);
  };

  // Disable itemization mode: keep total amount, drop line items
  const disableItemization = () => {
    disableItemizationHook(setAmount, setCategory);
  };

  // Handler for itemization toggle
  const handleItemizationToggle = (value: boolean) => {
    setShowItemization(value);
  };

  // Reset form utility function
  const resetForm = () => {
    resetFormUtil({
      setIntent,
      setShowItemization,
      setTitle,
      setAmount,
      setDate,
      setCategory,
      setDescription,
      setNote,
      setDebitAccountId,
      setCreditAccountId,
      setLineItems,
      setUseAI,
      setAutoPopulated,
      setAiSuggestions,
      setIsAILoading,
      setLineItemAILoading,
      setLineItemAISuggestions,
      setCreatedTransactionId,
      setShowReceiptUpload,
      setShowMoreDetails,
      setShowAccountingPreview,
      setCompletedFields,
      setAiModalDescription,
      setShowSaveSuccess,
    });
  };

  // Form helpers (extracted to hook)
  const formHelpers = useTransactionFormHelpers({
    title,
    amount,
    transactionType,
    isBusiness,
  });
  const { showAIButton, canUseAI } = formHelpers;

  // AI handlers (extracted to hook)
  const aiHandlers = useTransactionAIHandlers({
    title,
    amount,
    date,
    category,
    description,
    transactionType,
    isBusiness,
    isAILoading,
    setIsAILoading,
    useAI,
    setUseAI,
    autoPopulated,
    setAutoPopulated,
    aiModalDescription,
    setAiModalDescription,
    aiSuggestions,
    setAiSuggestions,
    aiSuggestedCategory,
    setAiSuggestedCategory,
    aiCategoryConfidence,
    setAiCategoryConfidence,
    lineItemAILoading,
    setLineItemAILoading,
    lineItemAISuggestions,
    setLineItemAISuggestions,
    setCategory,
    setDebitAccountId,
    setCreditAccountId,
    setIntent,
    setShowAccountingPreview,
    setCompletedFields,
    lineItems,
    showItemization,
    updateLineItem,
    userAccounts,
  });
  const {
    handleDoubleEntryAI,
    handleManualAITrigger,
    handleSelectSuggestion,
    handleLineItemAI,
  } = aiHandlers;

  // Submission handler (extracted to hook)
  const submissionHandler = useTransactionSubmissionHandler({
    title,
    amount,
    date,
    category,
    description,
    note,
    transactionType,
    isBusiness,
    showItemization,
    lineItems,
    debitAccountId,
    creditAccountId,
    setTitle,
    setAmount,
    setDate,
    setCategory,
    setDescription,
    setNote,
    setDebitAccountId,
    setCreditAccountId,
    setLineItems,
    setShowItemization,
    setErrors,
    setCompletedFields,
    isSubmitting,
    setIsSubmitting,
    saveAndAddAnother,
    setSaveAndAddAnother,
    showSaveSuccess,
    setShowSaveSuccess,
    setCreatedTransactionId,
    useAI,
    aiSuggestedCategory,
    aiSuggestions,
    aiCategoryConfidence,
    autoPopulated,
    setAutoPopulated,
    autoPopulatedFromReceipt,
    setAutoPopulatedFromReceipt,
    splitHook,
    duplicateDismissed,
    setDuplicateDismissed,
    showReceiptUpload,
    setShowReceiptUpload,
    similarTransactions,
    userAccounts,
    onClose,
    resetForm,
  });
  const { handleSubmit } = submissionHandler;

  return {
    // Form state
    intent,
    setIntent,
    transactionType,
    isBusiness,
    title,
    setTitle,
    amount,
    setAmount,
    date,
    setDate,
    category,
    setCategory,
    description,
    setDescription,
    note,
    setNote,
    debitAccountId,
    setDebitAccountId,
    creditAccountId,
    setCreditAccountId,
    advancedOpen,
    setAdvancedOpen,
    showMoreDetails,
    setShowMoreDetails,
    showAccountingPreview,
    setShowAccountingPreview,
    completedFields,
    setCompletedFields,
    frequentlyItemizes,
    setFrequentlyItemizes,
    entryMode,
    hasValidTitle,

    // Line items
    lineItems,
    showItemization,
    lineItemsTotal,
    totalsMatch: totalsMatchResult,
    totalsDifference,
    addLineItem,
    removeLineItem,
    updateLineItem,
    enableItemization,
    disableItemization,
    setLineItems,
    setShowItemization,

    // Validation
    errors,
    validateForm,
    clearErrors,
    setErrors,

    // AI state
    useAI,
    setUseAI,
    autoPopulated,
    setAutoPopulated,
    isAILoading,
    setIsAILoading,
    aiSuggestions,
    setAiSuggestions,
    aiModalDescription,
    setAiModalDescription,
    lineItemAILoading,
    setLineItemAILoading,
    lineItemAISuggestions,
    setLineItemAISuggestions,
    aiSuggestedCategory,
    setAiSuggestedCategory,
    aiCategoryConfidence,
    setAiCategoryConfidence,

    // Submission
    isSubmitting,
    setIsSubmitting,
    saveAndAddAnother,
    setSaveAndAddAnother,
    showSaveSuccess,
    setShowSaveSuccess,
    createdTransactionId,
    setCreatedTransactionId,
    handleSubmit,

    // Receipt OCR
    receipts,
    receiptOCRData,
    setReceiptOCRData,
    isProcessingOCR,
    setIsProcessingOCR,
    autoPopulatedFromReceipt,
    setAutoPopulatedFromReceipt,
    uploadedReceipts,
    setUploadedReceipts,
    showReceiptUpload,
    setShowReceiptUpload,

    // Split transaction
    splitHook,

    // Tax & Compliance
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

    // Similar transactions
    hasSimilarTransaction,
    similarTransactions,

    // Duplicate detection
    duplicateMatch,
    duplicateDismissed,
    setDuplicateDismissed,

    // Form helpers
    showAIButton,
    canUseAI,

    // AI handlers
    handleDoubleEntryAI,
    handleManualAITrigger,
    handleSelectSuggestion,
    handleLineItemAI,

    // Itemization handlers
    handleItemizationToggle,

    // Reset form
    resetForm,

    // User accounts
    userAccounts,
  };
}

