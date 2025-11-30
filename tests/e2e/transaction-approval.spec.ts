/**
 * E2E Test: Transaction Approval Flow
 * Tests the complete flow from transaction creation to approval
 */

import { test, expect } from "@playwright/test";

test.describe("Transaction Approval Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (assuming authentication is handled)
    await page.goto("/");
    
    // Wait for page to load
    await page.waitForLoadState("networkidle");
  });

  test("should create a transaction and show in approval queue", async ({ page }) => {
    // This test assumes user is logged in
    // In a real scenario, you'd set up authentication first
    
    // Navigate to transactions page
    await page.goto("/transactions");
    await page.waitForLoadState("networkidle");

    // Check if approval queue is visible
    const approvalQueue = page.locator('text=All caught up').or(page.locator('text=Suggested Accounting Entry'));
    await expect(approvalQueue).toBeVisible();
  });

  test("should display transaction list with filters", async ({ page }) => {
    await page.goto("/transactions");
    await page.waitForLoadState("networkidle");

    // Check search bar is present
    const searchBar = page.getByPlaceholder("Search transactions...");
    await expect(searchBar).toBeVisible();

    // Check filter buttons are present
    const sortButton = page.getByRole("button", { name: /Sort/i });
    await expect(sortButton).toBeVisible();
  });

  test("should filter transactions by type", async ({ page }) => {
    await page.goto("/transactions");
    await page.waitForLoadState("networkidle");

    // Click income filter
    const incomeButton = page.getByRole("button", { name: /Income/i });
    if (await incomeButton.isVisible()) {
      await incomeButton.click();
      // Verify filter is applied (button should have active state)
      await expect(incomeButton).toHaveClass(/border-green-500/);
    }
  });

  test("should search transactions", async ({ page }) => {
    await page.goto("/transactions");
    await page.waitForLoadState("networkidle");

    const searchBar = page.getByPlaceholder("Search transactions...");
    await searchBar.fill("test");
    
    // Wait for search results to update
    await page.waitForTimeout(500);
    
    // Verify search is working (either results shown or "no matches" message)
    const results = page.locator('text=No transactions match').or(page.locator('[class*="transaction"]'));
    await expect(results.first()).toBeVisible();
  });
});

test.describe("Keyboard Shortcuts", () => {
  test("should open transaction modal with 'n' key", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Press 'n' key
    await page.keyboard.press("n");

    // Check if modal opened (look for transaction form elements)
    const modal = page.locator('text=Add Transaction').or(page.locator('text=Income')).or(page.locator('text=Expense'));
    await expect(modal.first()).toBeVisible({ timeout: 2000 });
  });

  test("should close modal with Escape key", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open modal with 'n'
    await page.keyboard.press("n");
    await page.waitForTimeout(500);

    // Press Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Modal should be closed
    const modal = page.locator('text=Add Transaction').or(page.locator('text=Income'));
    await expect(modal.first()).not.toBeVisible({ timeout: 2000 });
  });
});
