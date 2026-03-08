import { expect, test } from "@playwright/test";

// Do not use shared storageState — this tests the auth flow itself
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication", () => {
	test("should display login page", async ({ page }) => {
		await page.goto("/login");

		await expect(page.locator("#login-email")).toBeVisible();
		await expect(page.locator("#login-password")).toBeVisible();
		await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
	});

	test("should login and redirect to dashboard", async ({ page }) => {
		const email = process.env.E2E_TEST_EMAIL;
		const password = process.env.E2E_TEST_PASSWORD;

		if (!email || !password) {
			test.skip();
			return;
		}

		await page.goto("/login");

		await page.locator("#login-email").fill(email);
		await page.locator("#login-password").fill(password);
		await page.getByRole("button", { name: "ログイン" }).click();

		await page.waitForURL("**/dashboard");
		await expect(page).toHaveURL(/\/dashboard/);
	});
});
