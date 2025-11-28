"use client";

/**
 * Mock Plaid Link Component
 * Simulates bank connection without requiring actual Plaid credentials
 */

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

interface MockBank {
  id: string;
  name: string;
  logo: string;
  accountTypes: string[];
}

const MOCK_BANKS: MockBank[] = [
  {
    id: "chase",
    name: "Chase Bank",
    logo: "🏦",
    accountTypes: ["Checking", "Savings", "Credit Card"],
  },
  {
    id: "bofa",
    name: "Bank of America",
    logo: "🏛️",
    accountTypes: ["Checking", "Savings"],
  },
  {
    id: "wells",
    name: "Wells Fargo",
    logo: "🏪",
    accountTypes: ["Checking", "Savings", "Investment"],
  },
  {
    id: "amex",
    name: "American Express",
    logo: "💳",
    accountTypes: ["Credit Card"],
  },
];

export default function MockPlaidLink() {
  const [showModal, setShowModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<MockBank | null>(null);
  const [loading, setLoading] = useState(false);

  const connectBank = useMutation(api.plaid.mockConnectBank as any);

  const handleBankSelect = async (bank: MockBank) => {
    setSelectedBank(bank);
    setLoading(true);

    try {
      // Simulate Plaid API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create mock bank connection
      await connectBank({
        bankId: bank.id,
        bankName: bank.name,
        accountTypes: bank.accountTypes,
      });

      setShowModal(false);
      // Reload page to show new accounts
      window.location.reload();
    } catch (error: any) {
      console.error("Connection error:", error);
      alert(`Failed to connect bank: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
      setSelectedBank(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        🔗 Connect Bank Account (Mock)
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-auto border border-border shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Select Your Bank</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground text-2xl transition-colors"
                disabled={loading}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {MOCK_BANKS.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => handleBankSelect(bank)}
                  disabled={loading}
                  className="border-2 border-border hover:border-primary rounded-lg p-6 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-background"
                >
                  <div className="text-4xl mb-2">{bank.logo}</div>
                  <div className="font-semibold text-lg text-foreground">{bank.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {bank.accountTypes.join(", ")}
                  </div>
                </button>
              ))}
            </div>

            {loading && selectedBank && (
              <div className="mt-6 text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="mt-2 text-muted-foreground">
                  Connecting to {selectedBank.name}...
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generating 90 days of transaction history...
                </p>
              </div>
            )}

            <div className="mt-6 p-4 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20">
              <p className="text-sm text-primary">
                <strong>Mock Mode:</strong> This is a simulated Plaid integration.
                No real banking credentials required. Transactions will be generated automatically.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

