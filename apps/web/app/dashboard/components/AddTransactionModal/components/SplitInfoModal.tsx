/**
 * SplitInfoModal Component
 * Modal explaining why and how to split transactions
 */

import { X, Check } from "lucide-react";

interface SplitInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SplitInfoModal({ isOpen, onClose }: SplitInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Why Split Transactions?</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">What is Transaction Splitting?</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Splitting allows you to break a single purchase into multiple line items, each with its own category. 
              This is especially useful for large shopping trips or bulk purchases where items belong to different expense categories.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Common Use Cases</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Costco/Target runs:</strong> Split groceries, office supplies, and household items into separate categories</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Amazon orders:</strong> Separate business tools, personal items, and office equipment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Restaurant receipts:</strong> Split food, drinks, and tips for accurate expense tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Mixed business/personal:</strong> Separate deductible business expenses from personal purchases</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Benefits</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Accurate tax categorization:</strong> Properly categorize deductible vs. non-deductible expenses</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Better budgeting:</strong> See exactly where your money goes by category</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Detailed reporting:</strong> Generate reports that show spending by specific categories</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Compliance:</strong> Maintain accurate records for tax purposes and audits</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 italic">
              💡 Tip: Our AI can automatically suggest how to split your transaction based on the merchant and amount. 
              You can always adjust the categories and amounts after splitting.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

