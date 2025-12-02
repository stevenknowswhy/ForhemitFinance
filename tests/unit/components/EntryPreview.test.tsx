/**
 * Unit Tests for EntryPreview Component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EntryPreview } from "@/app/dashboard/components/EntryPreview";
import { Id } from "../../../../convex/_generated/dataModel";

// Mock Convex mutations
const mockApproveEntry = vi.fn().mockResolvedValue(undefined);
const mockRejectEntry = vi.fn().mockResolvedValue(undefined);

// Track mutation calls to determine which one to return
let mutationCallIndex = 0;

vi.mock("convex/react", () => ({
  useMutation: vi.fn((mutation) => {
    mutationCallIndex++;
    // EntryPreview calls useMutation twice: once for approveEntry, once for rejectEntry
    // We'll return the appropriate mock based on call order
    // This is a simple heuristic - in a real scenario you'd inspect the mutation object
    if (mutationCallIndex % 2 === 1) {
      return mockApproveEntry;
    } else {
      return mockRejectEntry;
    }
  }),
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
    mutationCallIndex = 0;
    mockApproveEntry.mockResolvedValue(undefined);
    mockRejectEntry.mockResolvedValue(undefined);
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

    // Should show alert icon for low confidence - AlertCircle is rendered as SVG
    // Check for the confidence percentage text which should be visible
    expect(screen.getByText("65% confidence")).toBeInTheDocument();
    // The AlertCircle icon should be present in the DOM
    const alertElements = document.querySelectorAll('svg');
    expect(alertElements.length).toBeGreaterThan(0);
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

  it("calls approveEntry mutation when approve button is clicked", async () => {
    render(<EntryPreview {...defaultProps} />);

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    // Wait for async operation
    await waitFor(() => {
      expect(mockApproveEntry).toHaveBeenCalledWith({ entryId: defaultProps.entryId });
    }, { timeout: 1000 });
  });

  it("calls rejectEntry mutation when reject button is clicked", async () => {
    render(<EntryPreview {...defaultProps} />);

    const rejectButton = screen.getByText("Reject");
    fireEvent.click(rejectButton);

    // Wait for async operation
    await waitFor(() => {
      expect(mockRejectEntry).toHaveBeenCalledWith({ entryId: defaultProps.entryId });
    }, { timeout: 1000 });
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    render(<EntryPreview {...defaultProps} onEdit={onEdit} />);

    const editButton = screen.getByLabelText("Edit entry");
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
