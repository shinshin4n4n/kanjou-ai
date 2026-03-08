import { expect, test } from "@playwright/test";

test.describe("AI Classification", () => {
	test("should show AI classify button when transactions are selected", async ({ page }) => {
		await page.goto("/transactions");

		// Check if there are unconfirmed transactions with checkboxes
		const checkboxes = page.locator('button[role="checkbox"]');
		const count = await checkboxes.count();

		if (count <= 1) {
			// Only the "select all" checkbox or no checkboxes — skip
			test.skip();
			return;
		}

		// Select the first unconfirmed transaction (skip the header checkbox)
		await checkboxes.nth(1).click();

		// The bulk action bar should appear with AI推定 button
		await expect(page.getByText("件選択中")).toBeVisible();
		await expect(page.getByRole("button", { name: "AI推定" })).toBeVisible();
	});

	test("should trigger AI classification", async ({ page }) => {
		await page.goto("/transactions");

		const checkboxes = page.locator('button[role="checkbox"]');
		const count = await checkboxes.count();

		if (count <= 1) {
			test.skip();
			return;
		}

		// Select an unconfirmed transaction
		await checkboxes.nth(1).click();

		// Click AI推定 button
		await page.getByRole("button", { name: "AI推定" }).click();

		// Button should show loading state
		// Wait for either the dialog to appear or a toast error (API might not be available)
		await expect(page.getByText("推定中…").or(page.locator('[role="dialog"]'))).toBeVisible({
			timeout: 30000,
		});
	});
});
