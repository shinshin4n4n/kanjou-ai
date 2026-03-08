import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("CSV Import", () => {
	test("should upload CSV and show preview", async ({ page }) => {
		await page.goto("/import");

		await expect(page.getByText("CSVインポート")).toBeVisible();

		// Upload test CSV file
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(path.join(__dirname, "fixtures/test-import.csv"));

		// Preview should show the parsed transactions
		await expect(page.getByText("プレビュー")).toBeVisible();
		await expect(page.getByText("汎用CSV")).toBeVisible();
		await expect(page.getByText("3件")).toBeVisible();

		// Verify preview table contains test data
		await expect(page.getByText("E2Eテスト通信費")).toBeVisible();
		await expect(page.getByText("E2Eテスト交通費")).toBeVisible();
		await expect(page.getByText("E2Eテスト消耗品")).toBeVisible();
	});

	test("should execute import and show success", async ({ page }) => {
		await page.goto("/import");

		// Upload test CSV
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(path.join(__dirname, "fixtures/test-import.csv"));

		await expect(page.getByText("プレビュー")).toBeVisible();

		// Execute import
		await page.getByRole("button", { name: "インポート実行" }).click();

		// Verify success
		await expect(page.getByText("インポート完了")).toBeVisible({
			timeout: 15000,
		});
		await expect(page.getByText("3件の取引をインポートしました")).toBeVisible();

		// Cleanup: navigate to transactions and delete imported test data
		await page.getByRole("link", { name: "取引一覧を見る" }).click();
		await page.waitForURL("**/transactions");

		for (const description of ["E2Eテスト通信費", "E2Eテスト交通費", "E2Eテスト消耗品"]) {
			const row = page.locator("tr", { hasText: description });
			if ((await row.count()) === 0) continue;
			await row.first().getByTitle("削除").click();
			await page.getByRole("button", { name: "削除" }).last().click();
			await expect(row.first()).toBeHidden({ timeout: 5000 });
		}
	});
});
