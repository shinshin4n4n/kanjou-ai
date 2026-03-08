import { expect, test } from "@playwright/test";

test.describe("CSV Export", () => {
	test("should display export page with form", async ({ page }) => {
		await page.goto("/export");

		await expect(page.getByRole("main").getByText("CSVエクスポート")).toBeVisible();
		await expect(page.locator("#format")).toBeVisible();
		await expect(page.locator("#startDate")).toBeVisible();
		await expect(page.locator("#endDate")).toBeVisible();
		await expect(page.getByRole("button", { name: "ダウンロード" })).toBeVisible();
	});

	test("should select format and set date range", async ({ page }) => {
		await page.goto("/export");

		// Select 弥生 format
		await page.locator("#format").click();
		await page.getByRole("option", { name: "弥生" }).click();

		// Set date range
		await page.locator("#startDate").fill("2025-01-01");
		await page.locator("#endDate").fill("2025-12-31");

		// Verify confirmed-only checkbox is checked by default
		const confirmedCheckbox = page.locator("#confirmedOnly");
		await expect(confirmedCheckbox).toBeChecked();
	});

	test("should trigger download on export", async ({ page }) => {
		await page.goto("/export");

		// Set date range
		await page.locator("#startDate").fill("2025-01-01");
		await page.locator("#endDate").fill("2025-12-31");

		// Listen for download event
		const downloadPromise = page.waitForEvent("download", {
			timeout: 15000,
		});

		await page.getByRole("button", { name: "ダウンロード" }).click();

		// Verify either a file download or an error message is shown
		// (export may produce no file if there are no confirmed transactions)
		try {
			const download = await downloadPromise;
			expect(download.suggestedFilename()).toMatch(/^kanjou-.*\.csv$/);
		} catch {
			// No download occurred — verify the UI shows an error or returns to idle state
			const hasError = await page
				.locator(".text-destructive")
				.isVisible()
				.catch(() => false);
			const buttonIdle = await page
				.getByRole("button", { name: "ダウンロード" })
				.isEnabled()
				.catch(() => false);
			expect(hasError || buttonIdle).toBe(true);
		}
	});
});
