/**
 * Unit Tests for EntryPreview Component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntryPreview } from "@/app/dashboard/components/EntryPreview";
import { Id } from "../../../../convex/_generated/dataModel";

// Mock Convex
vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn()),
}));

describe("EntryPreview", () => {
  const mockEntryId = "test-entry-id" as Id<"entries_proposed">;
  const defaultProps = {
    entryId: mockEntryId,
    debitAccountName: "Fuel Expense",
    creditAccountName: "Checking Account",
    amount: 42.50,
    explanation: "I chose this because gas is a common operating expense.",
    confidence: 0.85,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders entry information correctly", () => {
    render(<EntryPreview {...defaultProps} />);

    expect(screen.getByText("Suggested Accounting Entry")).toBeInTheDocument();
    expect(screen.getByText("Fuel Expense")).toBeInTheDocument();
    expect(screen.getByText("Checking Account")).toBeInTheDocument();
    expect(screen.getByText("$42.50")).toBeInTheDocument();
    expect(screen.getByText(/I chose this because/)).toBeInTheDocument();
  });

  it("displays confidence score", () => {
    render(<EntryPreview {...defaultProps} />);

    expect(screen.getByText("85% confidence")).toBeInTheDocument();
  });

  it("shows low confidence warning when confidence < 70%", () => {
    render(<EntryPreview {...defaultProps} confidence={0.65} />);

    // Should show alert icon for low confidence
    const alertIcon = screen.getByRole("img", { hidden: true });
    expect(alertIcon).toBeInTheDocument();
  });

  it("displays memo when provided", () => {
    render(<EntryPreview {...defaultProps} memo="Gas station purchase" />);

    expect(screen.getByText("Gas station purchase")).toBeInTheDocument();
  });

  it("shows alternatives when confidence is low and alternatives exist", () => {
    const alternatives = [
      {
        debitAccountId: "acc1",
        creditAccountId: "acc2",
        debitAccountName: "Travel Expense",
        creditAccountName: "Credit Card",
        explanation: "Alternative explanation",
        confidence: 0.6,
      },
    ];

    render(
      <EntryPreview
        {...defaultProps}
        confidence={0.65}
        alternatives={alternatives}
      />
    );

    expect(screen.getByText(/alternative suggestion/i)).toBeInTheDocument();
  });

  it("expands explanation when 'Show more' is clicked", () => {
    const longExplanation = "A".repeat(200);
    render(<EntryPreview {...defaultProps} explanation={longExplanation} />);

    const showMoreButton = screen.getByText("Show more");
    expect(showMoreButton).toBeInTheDocument();

    fireEvent.click(showMoreButton);
    expect(screen.getByText("Show less")).toBeInTheDocument();
  });

  it("calls onApprove when approve button is clicked", () => {
    const onApprove = vi.fn();
    render(<EntryPreview {...defaultProps} onApprove={onApprove} />);

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    expect(onApprove).toHaveBeenCalled();
  });

  it("calls onReject when reject button is clicked", () => {
    const onReject = vi.fn();
    render(<EntryPreview {...defaultProps} onReject={onReject} />);

    const rejectButton = screen.getByText("Reject");
    fireEvent.click(rejectButton);

    expect(onReject).toHaveBeenCalled();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    render(<EntryPreview {...defaultProps} onEdit={onEdit} />);

    const editButton = screen.getByTitle("Edit entry");
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalled();
  });

  it("formats amount correctly", () => {
    render(<EntryPreview {...defaultProps} amount={1234.56} />);

    expect(screen.getByText("$1,234.56")).toBeInTheDocument();
  });

  it("handles zero confidence gracefully", () => {
    render(<EntryPreview {...defaultProps} confidence={0} />);

    expect(screen.getByText("0% confidence")).toBeInTheDocument();
  });
});
