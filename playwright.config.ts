import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "html" : "list",
	use: {
		baseURL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "setup",
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: path.join(__dirname, "tests/e2e/.auth/storage-state.json"),
			},
			dependencies: ["setup"],
		},
	],
	webServer: process.env.BASE_URL
		? undefined
		: {
				command: "npm run build && npm run start",
				port: 3000,
				reuseExistingServer: !process.env.CI,
				timeout: 120_000,
			},
});
