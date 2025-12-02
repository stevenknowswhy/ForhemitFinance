/**
 * Unit Tests for ApprovalQueue Component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ApprovalQueue } from "@/app/dashboard/components/ApprovalQueue";

// Mock Convex
const mockUseQuery = vi.fn(() => []);
const mockUseMutation = vi.fn(() => vi.fn());
const mockUseAction = vi.fn(() => vi.fn());

vi.mock("convex/react", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: (...args: any[]) => mockUseMutation(...args),
  useAction: (...args: any[]) => mockUseAction(...args),
}));

// Mock react-swipeable
vi.mock("react-swipeable", () => ({
  useSwipeable: vi.fn(() => ({})),
}));

// Mock useToast
vi.mock("@/lib/use-toast", () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe("ApprovalQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks - can be overridden in individual tests
    mockUseQuery.mockReturnValue([]);
    mockUseMutation.mockReturnValue(vi.fn().mockResolvedValue(undefined));
    mockUseAction.mockReturnValue(vi.fn().mockResolvedValue(undefined));
  });

  it("renders empty state when no pending entries", () => {
    mockUseQuery.mockReturnValue([]);

    render(<ApprovalQueue />);

    expect(screen.getByText("All caught up!")).toBeInTheDocument();
    expect(screen.getByText("No pending entries to approve.")).toBeInTheDocument();
  });

  it("displays pending entries when available", () => {
    const mockEntries = [
      {
        _id: "entry1" as any,
        debitAccount: { name: "Fuel Expense" },
        creditAccount: { name: "Checking" },
        amount: 42.50,
        explanation: "Test explanation",
        confidence: 0.85,
      },
    ];

    const mockAccounts = [
      { _id: "acc1" as any, name: "Fuel Expense", type: "expense" },
      { _id: "acc2" as any, name: "Checking", type: "asset" },
    ];

    mockUseQuery
      .mockReturnValueOnce(mockEntries)  // First call: getPendingTransactions
      .mockReturnValueOnce(mockAccounts); // Second call: getAll accounts

    render(<ApprovalQueue />);

    expect(screen.getByText("Suggested Accounting Entry")).toBeInTheDocument();
  });

  it("shows bulk actions when entries are selected", async () => {
    const mockEntries = [
      {
        _id: "entry1" as any,
        debitAccount: { name: "Fuel Expense" },
        creditAccount: { name: "Checking" },
        amount: 42.50,
        explanation: "Test explanation",
        confidence: 0.85,
      },
    ];

    const mockAccounts = [
      { _id: "acc1" as any, name: "Fuel Expense", type: "expense" },
      { _id: "acc2" as any, name: "Checking", type: "asset" },
    ];

    // Reset and set up mocks - alternate between entries and accounts
    mockUseQuery.mockReset();
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      // Odd calls (1, 3, 5...) return entries, even calls (2, 4, 6...) return accounts
      return callCount % 2 === 1 ? mockEntries : mockAccounts;
    });

    render(<ApprovalQueue />);

    // Wait for component to render with entries
    await waitFor(() => {
      expect(screen.getByText("Suggested Accounting Entry")).toBeInTheDocument();
    });

    // Click checkbox to select entry
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    // Check for the selected text - it says "1 entry selected" or "1 entries selected"
    await waitFor(() => {
      const selectedText = screen.queryByText(/1 entr/i);
      expect(selectedText).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("handles select all functionality", async () => {
    const mockEntries = [
      {
        _id: "entry1" as any,
        debitAccount: { name: "Fuel Expense" },
        creditAccount: { name: "Checking" },
        amount: 42.50,
        explanation: "Test explanation",
        confidence: 0.85,
      },
      {
        _id: "entry2" as any,
        debitAccount: { name: "Office Supplies" },
        creditAccount: { name: "Credit Card" },
        amount: 25.00,
        explanation: "Test explanation 2",
        confidence: 0.90,
      },
    ];

    const mockAccounts = [
      { _id: "acc1" as any, name: "Fuel Expense", type: "expense" },
      { _id: "acc2" as any, name: "Checking", type: "asset" },
    ];

    // Reset and set up mocks - alternate between entries and accounts
    mockUseQuery.mockReset();
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      // Odd calls (1, 3, 5...) return entries, even calls (2, 4, 6...) return accounts
      return callCount % 2 === 1 ? mockEntries : mockAccounts;
    });

    render(<ApprovalQueue />);

    // Wait for component to render with entries - use getAllByText since there are 2 entries
    await waitFor(() => {
      const entries = screen.getAllByText("Suggested Accounting Entry");
      expect(entries.length).toBeGreaterThan(0);
    });

    // Find the "Select All" button - it should show "Select All (2)"
    const selectAllButton = screen.getByText(/Select All \(2\)/);
    
    fireEvent.click(selectAllButton);

    // After selecting all, should show "2 entries selected"
    await waitFor(() => {
      const selectedText = screen.queryByText(/2 entr/i);
      expect(selectedText).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
