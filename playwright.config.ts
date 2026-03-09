import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Load .env.local for local E2E runs (CRLF-safe)
const envLocalPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envLocalPath)) {
	for (const line of fs.readFileSync(envLocalPath, "utf-8").split("\n")) {
		const trimmed = line.replace(/\r$/, "").trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIndex = trimmed.indexOf("=");
		if (eqIndex === -1) continue;
		const key = trimmed.slice(0, eqIndex);
		const value = trimmed.slice(eqIndex + 1);
		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
}

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
		...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET && {
			extraHTTPHeaders: {
				"x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
			},
		}),
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
