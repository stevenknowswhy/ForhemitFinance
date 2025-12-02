/**
 * Mock Convex Context for Unit Tests
 * Provides mock implementations of Convex query/mutation context
 */

import { vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";

export interface MockUser {
    _id: Id<"users">;
    email: string;
    name?: string;
    isSuperAdmin?: boolean;
}

export interface MockOrganization {
    _id: Id<"organizations">;
    name: string;
    type: "business" | "personal";
    status: "active" | "trial" | "suspended" | "deleted";
    baseCurrency: string;
    fiscalYearStart?: string;
    accountingMethod?: "cash" | "accrual";
    createdAt: number;
    updatedAt: number;
}

export interface MockMembership {
    _id: Id<"memberships">;
    userId: Id<"users">;
    orgId: Id<"organizations">;
    role: "ORG_OWNER" | "ORG_ADMIN" | "BOOKKEEPER" | "VIEWER";
    status: "active" | "invited" | "disabled";
    createdAt: number;
}

/**
 * Create a mock database with in-memory storage
 */
export function createMockDatabase() {
    const storage = new Map<string, any[]>();

    return {
        query: (table: string) => ({
            withIndex: (indexName: string, fn?: (q: any) => any) => ({
                filter: (fn: (q: any) => any) => ({
                    collect: async () => storage.get(table) || [],
                    first: async () => (storage.get(table) || [])[0] || null,
                }),
                collect: async () => storage.get(table) || [],
                first: async () => (storage.get(table) || [])[0] || null,
                order: (direction: "asc" | "desc") => ({
                    collect: async () => storage.get(table) || [],
                    first: async () => (storage.get(table) || [])[0] || null,
                }),
            }),
            collect: async () => storage.get(table) || [],
            first: async () => (storage.get(table) || [])[0] || null,
        }),
        get: async (id: Id<any>) => {
            for (const [table, items] of storage.entries()) {
                const item = items.find((i) => i._id === id);
                if (item) return item;
            }
            return null;
        },
        insert: async (table: string, doc: any) => {
            const items = storage.get(table) || [];
            const id = `${table}_${Date.now()}_${Math.random()}` as Id<any>;
            const newDoc = { ...doc, _id: id };
            items.push(newDoc);
            storage.set(table, items);
            return id;
        },
        patch: async (id: Id<any>, updates: any) => {
            for (const [table, items] of storage.entries()) {
                const index = items.findIndex((i) => i._id === id);
                if (index !== -1) {
                    items[index] = { ...items[index], ...updates };
                    storage.set(table, items);
                    return;
                }
            }
        },
        delete: async (id: Id<any>) => {
            for (const [table, items] of storage.entries()) {
                const filtered = items.filter((i) => i._id !== id);
                if (filtered.length !== items.length) {
                    storage.set(table, filtered);
                    return;
                }
            }
        },
        // Helper to seed data
        _seed: (table: string, data: any[]) => {
            storage.set(table, data);
        },
        // Helper to clear data
        _clear: () => {
            storage.clear();
        },
    };
}

/**
 * Create mock authentication context
 */
export function createMockAuth(user?: MockUser) {
    return {
        getUserIdentity: async () => {
            if (!user) return null;
            return {
                subject: user._id,
                email: user.email,
                name: user.name,
            };
        },
    };
}

/**
 * Create a complete mock Convex context
 */
export function createMockContext(options: {
    user?: MockUser;
    seedData?: { table: string; data: any[] }[];
} = {}) {
    const db = createMockDatabase();
    const auth = createMockAuth(options.user);

    // Seed initial data
    if (options.seedData) {
        options.seedData.forEach(({ table, data }) => {
            db._seed(table, data);
        });
    }

    return {
        db,
        auth,
    };
}

/**
 * Helper to create test IDs
 */
export function createTestId<T extends keyof any>(table: T): Id<T> {
    return `${String(table)}_${Date.now()}_${Math.random()}` as Id<T>;
}
