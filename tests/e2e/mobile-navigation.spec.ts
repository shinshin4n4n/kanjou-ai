import { expect, test } from "@playwright/test";

test.describe("Mobile Navigation", () => {
	test("should display sidebar trigger on mobile", async ({ page }) => {
		await page.goto("/dashboard");

		const trigger = page.locator("[data-sidebar='trigger']");
		await expect(trigger).toBeVisible();
	});

	test("should open sidebar and navigate via menu", async ({ page }) => {
		await page.goto("/dashboard");

		// Open mobile sidebar
		const trigger = page.locator("[data-sidebar='trigger']");
		await trigger.click();

		// Verify navigation links are visible
		const sidebar = page.locator("[data-mobile='true']");
		await expect(sidebar.getByText("取引一覧")).toBeVisible();
		await expect(sidebar.getByText("CSVインポート")).toBeVisible();
		await expect(sidebar.getByText("CSVエクスポート")).toBeVisible();

		// Navigate to transactions
		await sidebar.getByText("取引一覧").click();
		await expect(page).toHaveURL(/\/transactions/);
	});

	test("should show correct layout on mobile viewport", async ({ page }) => {
		await page.goto("/dashboard");

		// Main content should be visible
		await expect(page.locator("main")).toBeVisible();

		// Dashboard heading should be visible
		await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
	});
});
