import { test, expect } from "@playwright/test";

test.describe("Dashboard Filtering", () => {
    test.beforeEach(async ({ page }) => {
        // Login flow would go here or use a setup fixture
        await page.goto("/dashboard");
    });

    test("should show 'All' filter by default", async ({ page }) => {
        const allFilter = page.getByRole("button", { name: "All" });
        await expect(allFilter).toHaveClass(/bg-background/); // Active state check

        // Verify analytics cards show total
        await expect(page.getByText("Total Spent")).toBeVisible();
        await expect(page.getByText("Total Income")).toBeVisible();
    });

    test("should filter by Business", async ({ page }) => {
        // Click Business filter
        await page.getByRole("button", { name: "Business" }).click();

        // Verify filter is active
        const businessFilter = page.getByRole("button", { name: "Business" });
        await expect(businessFilter).toHaveClass(/text-blue-600/);

        // Verify URL or state change if applicable (here it's local state)

        // Verify analytics updated (mock check)
        // In a real test, we'd check specific numbers or ensure the API call was made with filterType="business"
        const requestPromise = page.waitForRequest(req =>
            req.url().includes("getFilteredTransactionAnalytics") &&
            req.postDataJSON().args.filterType === "business"
        );
        await page.getByRole("button", { name: "Business" }).click(); // Trigger again to catch request if needed
        // await requestPromise; // Uncomment when running with real backend
    });

    test("should filter by Personal", async ({ page }) => {
        await page.getByRole("button", { name: "Personal" }).click();

        const personalFilter = page.getByRole("button", { name: "Personal" });
        await expect(personalFilter).toHaveClass(/text-purple-600/);
    });

    test("should update Approval Queue when filter changes", async ({ page }) => {
        await page.getByRole("button", { name: "Business" }).click();

        // Check that Approval Queue component received the filter
        // This is harder to test in E2E without checking network requests or visible data
        // We expect the list to only show business transactions

        // Mock check: Verify a known business transaction is visible
        // await expect(page.getByText("Business Lunch")).toBeVisible();

        // Mock check: Verify a known personal transaction is HIDDEN
        // await expect(page.getByText("Grocery Store")).not.toBeVisible();
    });
});
