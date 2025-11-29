"use client";

/**
 * Universal "+" Button Component
 * Floating action button for adding income/expense transactions
 */

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTransactionModal } from "./AddTransactionModal";

export function AddTransactionButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground",
          "shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200",
          "flex items-center justify-center z-50",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        )}
        aria-label="Add transaction"
      >
        <Plus className="w-6 h-6" />
      </button>
      {showModal && (
        <AddTransactionModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

