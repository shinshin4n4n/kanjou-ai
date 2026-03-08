import path from "node:path";
import { expect, test as setup } from "@playwright/test";

const storageStatePath = path.join(__dirname, ".auth/storage-state.json");

setup("authenticate", async ({ page }) => {
	const email = process.env.E2E_TEST_EMAIL;
	const password = process.env.E2E_TEST_PASSWORD;

	if (!email || !password) {
		throw new Error("E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set in environment variables");
	}

	await page.goto("/login");

	await page.locator("#login-email").fill(email);
	await page.locator("#login-password").fill(password);
	await page.getByRole("button", { name: "ログイン" }).click();

	await page.waitForURL("**/dashboard");
	await expect(page).toHaveURL(/\/dashboard/);

	await page.context().storageState({ path: storageStatePath });
});
