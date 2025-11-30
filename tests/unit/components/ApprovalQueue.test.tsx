/**
 * Unit Tests for ApprovalQueue Component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApprovalQueue } from "@/app/dashboard/components/ApprovalQueue";

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => []),
  useMutation: vi.fn(() => vi.fn()),
  useAction: vi.fn(() => vi.fn()),
}));

// Mock react-swipeable
vi.mock("react-swipeable", () => ({
  useSwipeable: vi.fn(() => ({})),
}));

describe("ApprovalQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no pending entries", () => {
    const { useQuery } = require("convex/react");
    useQuery.mockReturnValue([]);

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

    const { useQuery } = require("convex/react");
    useQuery.mockReturnValueOnce(mockEntries).mockReturnValueOnce([]);

    render(<ApprovalQueue />);

    expect(screen.getByText("Suggested Accounting Entry")).toBeInTheDocument();
  });

  it("shows bulk actions when entries are selected", () => {
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

    const { useQuery } = require("convex/react");
    useQuery.mockReturnValueOnce(mockEntries).mockReturnValueOnce([]);

    render(<ApprovalQueue />);

    // Click checkbox to select entry
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(screen.getByText(/selected/)).toBeInTheDocument();
  });

  it("handles select all functionality", () => {
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

    const { useQuery } = require("convex/react");
    useQuery.mockReturnValueOnce(mockEntries).mockReturnValueOnce([]);

    render(<ApprovalQueue />);

    const selectAllButton = screen.getByText(/Select All/);
    fireEvent.click(selectAllButton);

    expect(screen.getByText(/2 entr/)).toBeInTheDocument();
  });
});
