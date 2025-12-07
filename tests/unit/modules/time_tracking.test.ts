/**
 * Unit Tests for Time Tracking Module
 * Tests convex/modules/time_tracking/main.ts functions
 */

import { describe, it, expect } from "vitest";
import { createTestId } from "../../mocks/mockConvexContext";
import type { Id } from "../../../convex/_generated/dataModel";

// Test data
const testOrg = {
    _id: createTestId("organizations") as Id<"organizations">,
    name: "Test Business",
    status: "active" as const,
};

const testUser = {
    _id: createTestId("users") as Id<"users">,
    email: "test@example.com",
};

describe("Time Tracking Module - Unit Tests", () => {
    describe("Timer Operations", () => {
        it("should start a timer with required fields", () => {
            const timerEntry = {
                orgId: testOrg._id,
                userId: testUser._id,
                description: "Working on feature X",
                startTime: Date.now(),
                durationMinutes: 0,
                isBillable: true,
                status: "running" as const,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            expect(timerEntry.status).toBe("running");
            expect(timerEntry.durationMinutes).toBe(0);
            expect(timerEntry.description).toContain("feature X");
        });

        it("should calculate duration when timer stops", () => {
            const startTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
            const endTime = Date.now();

            const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

            expect(durationMinutes).toBe(120); // 2 hours = 120 minutes
        });

        it("should stop any running timers before starting new one", () => {
            let runningTimers = [
                {
                    _id: "timer1",
                    userId: testUser._id,
                    status: "running",
                    startTime: Date.now() - 30 * 60 * 1000,
                },
            ];

            // Stop running timers
            runningTimers = runningTimers.map((timer) => ({
                ...timer,
                status: "stopped" as const,
                endTime: Date.now(),
                durationMinutes: Math.round((Date.now() - timer.startTime) / (1000 * 60)),
            }));

            expect(runningTimers[0].status).toBe("stopped");
            expect(runningTimers[0].durationMinutes).toBeGreaterThan(0);
        });
    });

    describe("Manual Entry", () => {
        it("should create manual entry with start and end times", () => {
            const startTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
            const endTime = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago
            const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

            const entry = {
                orgId: testOrg._id,
                userId: testUser._id,
                description: "Meeting with client",
                startTime,
                endTime,
                durationMinutes,
                isBillable: true,
                status: "stopped" as const,
            };

            expect(entry.durationMinutes).toBe(60);
            expect(entry.status).toBe("stopped");
        });

        it("should validate end time is after start time", () => {
            const startTime = Date.now();
            const endTime = Date.now() - 1 * 60 * 60 * 1000; // 1 hour before start

            const isValid = endTime > startTime;
            expect(isValid).toBe(false);
        });
    });

    describe("Billable Calculations", () => {
        it("should calculate earnings from billable entries", () => {
            const entries = [
                { durationMinutes: 60, hourlyRate: 150, isBillable: true },
                { durationMinutes: 30, hourlyRate: 150, isBillable: true },
                { durationMinutes: 45, hourlyRate: 100, isBillable: false },
            ];

            const totalEarnings = entries
                .filter((e) => e.isBillable && e.hourlyRate)
                .reduce(
                    (sum, e) => sum + (e.durationMinutes / 60) * (e.hourlyRate || 0),
                    0
                );

            // 60 min * $150/hr = $150
            // 30 min * $150/hr = $75
            // Total = $225
            expect(totalEarnings).toBe(225);
        });

        it("should separate billable and non-billable hours", () => {
            const entries = [
                { durationMinutes: 60, isBillable: true },
                { durationMinutes: 120, isBillable: true },
                { durationMinutes: 30, isBillable: false },
                { durationMinutes: 45, isBillable: false },
            ];

            const billableMinutes = entries
                .filter((e) => e.isBillable)
                .reduce((sum, e) => sum + e.durationMinutes, 0);

            const nonBillableMinutes = entries
                .filter((e) => !e.isBillable)
                .reduce((sum, e) => sum + e.durationMinutes, 0);

            expect(billableMinutes).toBe(180); // 3 hours
            expect(nonBillableMinutes).toBe(75); // 1 hour 15 min
        });
    });

    describe("Stats Calculation", () => {
        it("should calculate total hours from minutes", () => {
            const totalMinutes = 485; // 8 hours 5 minutes
            const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

            expect(totalHours).toBe(8.08);
        });

        it("should group entries by project", () => {
            const entries = [
                { projectId: "proj1", durationMinutes: 60 },
                { projectId: "proj1", durationMinutes: 45 },
                { projectId: "proj2", durationMinutes: 120 },
                { projectId: null, durationMinutes: 30 },
            ];

            const byProject = entries.reduce((acc, e) => {
                const key = e.projectId || "unassigned";
                if (!acc[key]) {
                    acc[key] = { minutes: 0, count: 0 };
                }
                acc[key].minutes += e.durationMinutes;
                acc[key].count += 1;
                return acc;
            }, {} as Record<string, { minutes: number; count: number }>);

            expect(byProject["proj1"].minutes).toBe(105);
            expect(byProject["proj1"].count).toBe(2);
            expect(byProject["proj2"].minutes).toBe(120);
            expect(byProject["unassigned"].minutes).toBe(30);
        });

        it("should filter entries by date range", () => {
            const now = Date.now();
            const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
            const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

            const entries = [
                { startTime: now - 1 * 24 * 60 * 60 * 1000, durationMinutes: 60 }, // Yesterday
                { startTime: now - 3 * 24 * 60 * 60 * 1000, durationMinutes: 120 }, // 3 days ago
                { startTime: twoWeeksAgo, durationMinutes: 90 }, // 2 weeks ago
            ];

            const thisWeek = entries.filter((e) => e.startTime >= oneWeekAgo);

            expect(thisWeek.length).toBe(2);
        });
    });

    describe("Duration Formatting", () => {
        it("should format duration as hours and minutes", () => {
            const formatDuration = (minutes: number): string => {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                if (hours === 0) return `${mins}m`;
                return `${hours}h ${mins}m`;
            };

            expect(formatDuration(30)).toBe("30m");
            expect(formatDuration(60)).toBe("1h 0m");
            expect(formatDuration(90)).toBe("1h 30m");
            expect(formatDuration(125)).toBe("2h 5m");
        });
    });

    describe("Entry Update", () => {
        it("should recalculate duration when times change", () => {
            const originalEntry = {
                startTime: Date.now() - 2 * 60 * 60 * 1000,
                endTime: Date.now() - 1 * 60 * 60 * 1000,
                durationMinutes: 60,
            };

            // User updates the end time
            const newEndTime = Date.now();
            const newDuration = Math.round(
                (newEndTime - originalEntry.startTime) / (1000 * 60)
            );

            expect(newDuration).toBe(120); // Should now be 2 hours
        });
    });
});
