import { expect, test } from "@playwright/test";

test.describe("Transactions", () => {
	const testDescription = `E2Eテスト取引 ${Date.now()}`;

	test("should create a new transaction", async ({ page }) => {
		await page.goto("/transactions/new");

		await page.locator("#transactionDate").fill("2025-01-15");
		await page.locator("#description").fill(testDescription);
		await page.locator("#amount").fill("1000");

		// Select debit account: 通信費
		await page.locator("#debitAccount").click();
		await page.getByRole("option", { name: "通信費" }).click();

		// Select credit account: 普通預金
		await page.locator("#creditAccount").click();
		await page.getByRole("option", { name: "普通預金" }).click();

		await page.getByRole("button", { name: "保存" }).click();

		// Should redirect to transactions list
		await page.waitForURL("**/transactions");
		await expect(page).toHaveURL(/\/transactions/);

		// Verify the created transaction appears in the list
		await expect(page.getByText(testDescription)).toBeVisible();
	});
});
