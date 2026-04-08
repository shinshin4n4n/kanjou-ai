import { expect, test } from "@playwright/test";

test.describe("Transactions", () => {
	test("should create a new transaction", async ({ page }) => {
		const testDescription = `E2Eテスト取引 ${Date.now()}`;
		// Use today's date so the transaction appears on page 1 (default sort: transaction_date DESC)
		const today = new Date().toISOString().split("T")[0] as string;

		await page.goto("/transactions/new");

		await page.locator("#transactionDate").fill(today);
		await page.locator("#description").fill(testDescription);
		await page.locator("#amount").fill("1000");

		// Select debit account: Software/Cloud/SaaS (EXP001)
		await page.locator("#debitAccount").click();
		await page.getByRole("option", { name: "Software/Cloud/SaaS" }).click();

		// Select credit account: Bank Account (AST002)
		await page.locator("#creditAccount").click();
		await page.getByRole("option", { name: "Bank Account" }).click();

		await page.getByRole("button", { name: "保存" }).click();

		// Should redirect to transactions list; surface form errors on timeout
		const errorLocator = page.locator(".text-destructive");
		const redirected = page
			.waitForURL("**/transactions", { timeout: 15000 })
			.then(() => true as const);
		const errorShown = errorLocator.waitFor({ state: "visible", timeout: 15000 }).then(async () => {
			const msg = await errorLocator.textContent();
			throw new Error(`Transaction save failed with form error: ${msg}`);
		});
		await Promise.race([redirected, errorShown]);
		await expect(page).toHaveURL(/\/transactions/);

		// Navigate to transactions list with search filter to avoid pagination issues
		await page.goto(`/transactions?search=${encodeURIComponent(testDescription)}`);
		await page.waitForLoadState("networkidle");

		// Verify the created transaction appears in the filtered list
		await expect(page.getByText(testDescription)).toBeVisible({ timeout: 15000 });

		// Cleanup: delete the created test transaction
		const row = page.locator("tr", { hasText: testDescription });
		await row.getByTitle("削除").click();
		await page.getByRole("button", { name: "削除", exact: true }).last().click();
		await page.waitForTimeout(2000);
	});
});
