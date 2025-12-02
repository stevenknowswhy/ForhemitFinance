/**
 * Keyboard shortcut handlers for transaction modal
 */

export interface KeyboardShortcutHandlers {
  onSave: () => void;
  onSaveAndAddAnother: () => void;
  onClose: () => void;
}

/**
 * Setup keyboard shortcuts for transaction form
 */
export function setupKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + S: Save
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      const form = document.getElementById("transaction-form") as HTMLFormElement;
      form?.requestSubmit();
    }

    // Cmd/Ctrl + Enter: Save & Add Another
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handlers.onSaveAndAddAnother();
      const form = document.getElementById("transaction-form") as HTMLFormElement;
      form?.requestSubmit();
    }

    // Esc: Close
    if (e.key === "Escape") {
      handlers.onClose();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}

