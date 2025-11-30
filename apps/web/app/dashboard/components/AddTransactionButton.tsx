"use client";

/**
 * Universal "+" Button Component
 * Floating action button for adding income/expense transactions
 * Supports keyboard shortcut: 'n' key
 */

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTransactionModal } from "./AddTransactionModal";

export function AddTransactionButton() {
  const [showModal, setShowModal] = useState(false);

  // Keyboard shortcut: 'n' key to open new transaction
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (
        e.key === "n" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setShowModal(true);
      }
      // Escape key to close modal
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showModal]);

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
        aria-label="Add transaction (Press 'n' for keyboard shortcut)"
        title="Add transaction (Press 'n')"
      >
        <Plus className="w-6 h-6" />
      </button>
      {showModal && (
        <AddTransactionModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

