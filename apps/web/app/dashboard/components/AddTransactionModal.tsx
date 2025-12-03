"use client";

/**
 * AddTransactionModal Component
 * Intent-first, conversational design: Single intent selection → Essential fields → Optional controls
 */

import { cn } from "@/lib/utils";
import { ReceiptUploadModal } from "./ReceiptUploadModal";
import type { AddTransactionModalProps } from "./AddTransactionModal/types";
import { IntentSelector } from "./AddTransactionModal/components/IntentSelector";
import { SplitInfoModal } from "./AddTransactionModal/components/SplitInfoModal";
import { AISuggestionsModal } from "./AddTransactionModal/components/AISuggestionsModal";
import { TaxComplianceSection } from "./AddTransactionModal/components/TaxComplianceSection";
import { ReceiptSection } from "./AddTransactionModal/components/ReceiptSection";
import { TransactionFormFields } from "./AddTransactionModal/components/TransactionFormFields";
import { ItemizationPanel } from "./AddTransactionModal/components/ItemizationPanel";
import { OptionalControlsSection } from "./AddTransactionModal/components/OptionalControlsSection";
import { AdvancedFlyout } from "./AddTransactionModal/components/AdvancedFlyout";
import { TransactionTypeToggle } from "./AddTransactionModal/components/TransactionTypeToggle";
import { ModalHeader } from "./AddTransactionModal/components/ModalHeader";
import { AILoadingOverlay } from "./AddTransactionModal/components/AILoadingOverlay";
import { ModalFooter } from "./AddTransactionModal/components/ModalFooter";
import { ItemizationFormFields } from "./AddTransactionModal/components/ItemizationFormFields";
import { useTransactionModalOrchestration } from "./AddTransactionModal/hooks/useTransactionModalOrchestration";

export function AddTransactionModal({ onClose }: AddTransactionModalProps) {
  // Use master orchestration hook - consolidates all hook initialization
  const {
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
    note,
    setNote,
    description,
    setDescription,
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
    errors,
    setErrors,
    // Line items
    lineItems,
    showItemization,
    lineItemsTotal,
    totalsMatch: totalsMatchResult,
    totalsDifference,
    addLineItem,
    removeLineItem,
    updateLineItem,
    disableItemization: disableItemizationHook,
    enableItemization,
    setLineItems,
    handleItemizationToggle,
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
    aiSuggestedCategory,
    aiCategoryConfidence,
    lineItemAILoading,
    lineItemAISuggestions,
    // Submission
    isSubmitting,
    saveAndAddAnother,
    setSaveAndAddAnother,
    showSaveSuccess,
    createdTransactionId,
    handleSubmit,
    // Receipt OCR
    receipts,
    receiptOCRData,
    uploadedReceipts,
    isProcessingOCR,
    setShowReceiptUpload,
    showReceiptUpload,
    // Split transaction
    showSplitPrompt,
    setShowSplitPrompt,
    splitSuggestions,
    isLoadingSplit,
    showSplitInfoModal,
    setShowSplitInfoModal,
    handleSplitSuggestion,
    // Tax & Compliance
    taxRate,
    taxAmount,
    isTaxInclusive,
    isTaxExempt,
    taxExemptReason,
    track1099,
    setTaxRate,
    setTaxAmount,
    setIsTaxInclusive,
    setIsTaxExempt,
    setTaxExemptReason,
    setTrack1099,
    // Similar transactions
    hasSimilarTransaction,
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
    // User accounts
    userAccounts,
  } = useTransactionModalOrchestration({ onClose });

  return (
    <>
      {/* Loading Overlay */}
      <AILoadingOverlay isVisible={isAILoading} />

      {/* AI Suggestions Modal */}
      <AISuggestionsModal
        isOpen={!!(aiSuggestions && aiSuggestions.length > 0)}
        suggestions={aiSuggestions || []}
        isLoading={isAILoading}
        description={aiModalDescription}
        onSelectSuggestion={handleSelectSuggestion}
        onRegenerate={() => handleManualAITrigger()}
        onClose={() => setAiSuggestions(null)}
      />


      <div 
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
      >
        <div 
          className={cn(
            "bg-white w-full h-full md:h-auto md:max-h-[90vh]",
            "md:max-w-[800px] md:rounded-2xl",
            "flex flex-col overflow-hidden md:overflow-y-auto",
            "animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200",
            "md:pt-6 md:px-7 md:pb-5",
            "p-6",
            isAILoading && "opacity-50 pointer-events-none"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHeader
            intent={intent}
            onClose={onClose}
            onResetIntent={() => setIntent(null)}
            isAILoading={isAILoading}
          />

          {/* Intent Selection - Single Question */}
          {intent === null && (
            <IntentSelector
              intent={intent}
              onIntentSelect={setIntent}
            />
          )}

          {/* Full Form (revealed after intent selection) */}
          {intent !== null && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick Business/Personal Toggle - Prominent visual indicator */}
              <TransactionTypeToggle
                isBusiness={isBusiness ?? false}
                transactionType={transactionType}
                onToggle={() => {
                  // Toggle between business and personal while keeping transaction type
                  if (transactionType === "expense") {
                    setIntent(isBusiness ? "personal_expense" : "business_expense");
                  } else {
                    setIntent(isBusiness ? "personal_income" : "business_income");
                  }
                }}
              />

              <form id="transaction-form" onSubmit={handleSubmit} className={cn(
                "flex flex-col space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 overflow-y-auto",
                intent !== null && "mt-0"
              )}>
                {/* Receipt Preview Section - Show at top on mobile, right column on desktop */}
                <ReceiptSection
                  receipts={receipts}
                  uploadedReceipts={uploadedReceipts}
                  isProcessingOCR={isProcessingOCR}
                  onFieldClick={(field, value) => {
                    if (field === "merchant") {
                      setTitle(value as string);
                    } else if (field === "amount") {
                      setAmount((value as number).toFixed(2));
                    } else if (field === "date") {
                      setDate(value as string);
                    }
                  }}
                  onUploadClick={() => setShowReceiptUpload(true)}
                  showInMobile={true}
                />

              <TransactionFormFields
                title={title}
                amount={amount}
                date={date}
                category={category}
                note={note}
                description={description}
                debitAccountId={debitAccountId}
                creditAccountId={creditAccountId}
                completedFields={completedFields}
                showItemization={showItemization}
                errors={errors}
                setTitle={setTitle}
                setAmount={setAmount}
                setDate={setDate}
                setCategory={setCategory}
                setNote={setNote}
                setDescription={setDescription}
                setDebitAccountId={setDebitAccountId}
                setCreditAccountId={setCreditAccountId}
                setErrors={setErrors}
                showMoreDetails={showMoreDetails}
                setShowMoreDetails={setShowMoreDetails}
                showAccountingPreview={showAccountingPreview}
                setShowAccountingPreview={setShowAccountingPreview}
                showSplitPrompt={showSplitPrompt}
                setShowSplitPrompt={setShowSplitPrompt}
                showSplitInfoModal={showSplitInfoModal}
                setShowSplitInfoModal={setShowSplitInfoModal}
                receipts={receipts}
                uploadedReceipts={uploadedReceipts}
                isProcessingOCR={isProcessingOCR}
                setShowReceiptUpload={setShowReceiptUpload}
                showAIButton={showAIButton}
                canUseAI={canUseAI}
                isAILoading={isAILoading}
                aiSuggestedCategory={aiSuggestedCategory ?? null}
                aiCategoryConfidence={aiCategoryConfidence ?? null}
                aiSuggestions={aiSuggestions}
                handleManualAITrigger={handleManualAITrigger}
                handleDoubleEntryAI={handleDoubleEntryAI}
                useAI={useAI}
                setUseAI={setUseAI}
                hasSimilarTransaction={hasSimilarTransaction}
                autoPopulated={autoPopulated}
                setAutoPopulated={setAutoPopulated}
                duplicateMatch={duplicateMatch}
                duplicateDismissed={duplicateDismissed}
                setDuplicateDismissed={setDuplicateDismissed}
                isLoadingSplit={isLoadingSplit}
                handleSplitSuggestion={() => handleSplitSuggestion(null)}
                handleItemizationToggle={handleItemizationToggle}
                userAccounts={userAccounts}
              />

              {/* Optional Controls - Conversational Links */}
              {intent !== null && !showItemization && (
                <OptionalControlsSection
                  note={note}
                  description={description}
                  debitAccountId={debitAccountId}
                  creditAccountId={creditAccountId}
                  amount={amount}
                  setNote={setNote}
                  setDescription={setDescription}
                  setDebitAccountId={setDebitAccountId}
                  setCreditAccountId={setCreditAccountId}
                  setTitle={setTitle}
                  setAmount={setAmount}
                  setDate={setDate}
                  setUseAI={setUseAI}
                  showMoreDetails={showMoreDetails}
                  setShowMoreDetails={setShowMoreDetails}
                  showAccountingPreview={showAccountingPreview}
                  setShowAccountingPreview={setShowAccountingPreview}
                  handleItemizationToggle={handleItemizationToggle}
                  handleDoubleEntryAI={handleDoubleEntryAI}
                  setShowReceiptUpload={setShowReceiptUpload}
                  receipts={receipts}
                  uploadedReceipts={uploadedReceipts}
                  isProcessingOCR={isProcessingOCR}
                  isAILoading={isAILoading}
                  canUseAI={canUseAI}
                  useAI={useAI}
                  title={title}
                  userAccounts={userAccounts}
                />
              )}

              {/* Itemization Mode Form Fields */}
              {showItemization && (
                <ItemizationFormFields
                  category={category}
                  setCategory={setCategory}
                  note={note}
                  setNote={setNote}
                  debitAccountId={debitAccountId}
                  creditAccountId={creditAccountId}
                  amount={amount}
                  userAccounts={userAccounts}
                />
              )}

              {/* Tax & Compliance Section - Itemization Mode Only */}
              {showItemization && (
                <div className="pt-4 border-t border-border">
                  <TaxComplianceSection
                    taxRate={taxRate}
                    taxAmount={taxAmount}
                    isTaxInclusive={isTaxInclusive}
                    isTaxExempt={isTaxExempt}
                    taxExemptReason={taxExemptReason}
                    track1099={track1099}
                    amount={amount}
                    onTaxRateChange={setTaxRate}
                    onTaxAmountChange={setTaxAmount}
                    onTaxInclusiveChange={setIsTaxInclusive}
                    onTaxExemptChange={setIsTaxExempt}
                    onTaxExemptReasonChange={setTaxExemptReason}
                    onTrack1099Change={setTrack1099}
                  />
                </div>
              )}

              {/* Itemized Receipt Section */}
              {showItemization && (
                <ItemizationPanel
                  lineItems={lineItems}
                  lineItemsTotal={lineItemsTotal}
                  totalsMatch={totalsMatchResult}
                  totalsDifference={totalsDifference}
                  amount={amount}
                  addLineItem={addLineItem}
                  removeLineItem={removeLineItem}
                  updateLineItem={updateLineItem}
                  disableItemization={() => handleItemizationToggle(false)}
                  handleLineItemAI={handleLineItemAI}
                  lineItemAILoading={lineItemAILoading}
                  lineItemAISuggestions={lineItemAISuggestions}
                  receiptOCRData={receiptOCRData}
                  setLineItems={setLineItems}
                  userAccounts={userAccounts}
                />
              )}
                </form>
            </div>
          )}

          {/* Footer */}
          {intent !== null && (
            <ModalFooter
              intent={intent}
              isSubmitting={isSubmitting}
              showSaveSuccess={showSaveSuccess}
              showItemization={showItemization}
              lineItemsLength={lineItems.length}
              title={title}
              amount={amount}
              onClose={onClose}
              onSaveAndAddAnother={() => {
                setSaveAndAddAnother(true);
                const form = document.getElementById("transaction-form") as HTMLFormElement;
                form?.requestSubmit();
              }}
            />
          )}

        </div>
      </div>

      {/* Advanced Flyout */}
      <AdvancedFlyout
        advancedOpen={advancedOpen}
        setAdvancedOpen={setAdvancedOpen}
        note={note}
        debitAccountId={debitAccountId}
        creditAccountId={creditAccountId}
        amount={amount}
        showAccountingPreview={showAccountingPreview}
        setShowAccountingPreview={setShowAccountingPreview}
        useAI={useAI}
        setNote={setNote}
        setTitle={setTitle}
        setAmount={setAmount}
        setDate={setDate}
        setDebitAccountId={setDebitAccountId}
        setCreditAccountId={setCreditAccountId}
        enableItemization={enableItemization}
        setShowReceiptUpload={setShowReceiptUpload}
        receipts={receipts}
        uploadedReceipts={uploadedReceipts}
        isProcessingOCR={isProcessingOCR}
        userAccounts={userAccounts}
      />

      {/* Split Transaction Info Modal */}
      <SplitInfoModal
        isOpen={showSplitInfoModal}
        onClose={() => setShowSplitInfoModal(false)}
      />

      {/* Receipt Upload Modal */}
      {showReceiptUpload && (
        <ReceiptUploadModal
          transactionId={createdTransactionId || undefined}
          onClose={() => {
            setShowReceiptUpload(false);
            // Refresh receipts query to get OCR data
            if (createdTransactionId) {
              // Query will automatically refresh
            }
          }}
          onUploadComplete={async (receiptUrls) => {
            console.log("Receipts uploaded:", receiptUrls);
            setShowReceiptUpload(false);
            // Receipts will automatically appear via the query if transaction exists
            // OCR processing happens automatically in ReceiptUploadModal
          }}
        />
      )}
    </>
  );
}
