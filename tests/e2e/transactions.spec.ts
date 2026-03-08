import { expect, test } from "@playwright/test";

test.describe("Transactions", () => {
	const testDescription = `E2Eテスト取引 ${Date.now()}`;

	test("should create a new transaction", async ({ page }) => {
		await page.goto("/transactions/new");

		// Set date via JS (native date input fill can be unreliable across browsers)
		await page.locator("#transactionDate").evaluate((el, val) => {
			const input = el as HTMLInputElement;
			const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
			setter?.call(input, val);
			input.dispatchEvent(new Event("input", { bubbles: true }));
			input.dispatchEvent(new Event("change", { bubbles: true }));
		}, "2025-01-15");

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
		await page.waitForURL("**/transactions", { timeout: 15000 });
		await expect(page).toHaveURL(/\/transactions/);

		// Verify the created transaction appears in the list
		await expect(page.getByText(testDescription)).toBeVisible();

		// Cleanup: delete the created test transaction
		const row = page.locator("tr", { hasText: testDescription });
		await row.getByTitle("削除").click();
		await page.getByRole("button", { name: "削除", exact: true }).last().click();
		await page.waitForTimeout(2000);
	});
});
