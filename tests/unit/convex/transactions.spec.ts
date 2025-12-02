import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPendingTransactions } from "../../../convex/transactions";

// Mock Convex values
const mockUser = { _id: "user123", email: "test@example.com" };
const mockIdentity = { email: "test@example.com" };

// Mock Query Builder
const mockQueryBuilder = {
    withIndex: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    take: vi.fn().mockResolvedValue([]),
};

// Mock Context
const mockCtx = {
    auth: {
        getUserIdentity: vi.fn().mockResolvedValue(mockIdentity),
    },
    db: {
        query: vi.fn().mockReturnValue(mockQueryBuilder),
        get: vi.fn(),
    },
};

describe("getPendingTransactions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default user query mock
        mockCtx.db.query.mockImplementation((table) => {
            if (table === "users") {
                return {
                    withIndex: () => ({
                        first: () => Promise.resolve(mockUser),
                    }),
                };
            }
            return mockQueryBuilder;
        });
    });

    it("should query entries_proposed with correct index", async () => {
        await getPendingTransactions.handler(mockCtx as any, { filterType: "all" });

        expect(mockCtx.db.query).toHaveBeenCalledWith("entries_proposed");
        expect(mockQueryBuilder.withIndex).toHaveBeenCalledWith("by_user_status", expect.any(Function));
    });

    it("should apply business filter when filterType is 'business'", async () => {
        await getPendingTransactions.handler(mockCtx as any, { filterType: "business" });

        expect(mockQueryBuilder.filter).toHaveBeenCalled();
        // We can't easily test the filter function content without more complex mocking, 
        // but we verify filter() was called.
    });

    it("should apply personal filter when filterType is 'personal'", async () => {
        await getPendingTransactions.handler(mockCtx as any, { filterType: "personal" });

        expect(mockQueryBuilder.filter).toHaveBeenCalled();
    });

    it("should NOT apply filter when filterType is 'all'", async () => {
        await getPendingTransactions.handler(mockCtx as any, { filterType: "all" });

        expect(mockQueryBuilder.filter).not.toHaveBeenCalled();
    });

    it("should enrich entries with transaction and account details", async () => {
        const mockEntry = {
            _id: "entry1",
            transactionId: "tx1",
            debitAccountId: "acc1",
            creditAccountId: "acc2",
        };

        mockQueryBuilder.take.mockResolvedValue([mockEntry]);
        mockCtx.db.get.mockImplementation((id) => {
            if (id === "tx1") return Promise.resolve({ description: "Test Tx" });
            if (id === "acc1") return Promise.resolve({ name: "Debit Acc", type: "expense" });
            if (id === "acc2") return Promise.resolve({ name: "Credit Acc", type: "asset" });
            return Promise.resolve(null);
        });

        const result = await getPendingTransactions.handler(mockCtx as any, { filterType: "all" });

        expect(result).toHaveLength(1);
        expect(result[0].transaction).toEqual({ description: "Test Tx" });
        expect(result[0].debitAccount).toEqual({ name: "Debit Acc", type: "expense" });
        expect(result[0].creditAccount).toEqual({ name: "Credit Acc", type: "asset" });
    });
});
