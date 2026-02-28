import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./tests/setup.ts"],
		// TubeReview方式: __tests__/ ディレクトリに配置
		include: [
			"src/**/__tests__/**/*.test.ts",
			"src/**/__tests__/**/*.test.tsx",
			"tests/unit/**/*.test.ts",
			"tests/integration/**/*.test.ts",
		],
		exclude: ["tests/e2e/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "text-summary", "json", "html"],
			include: ["src/**/*.ts", "src/**/*.tsx"],
			exclude: [
				"src/types/**",
				"src/**/*.d.ts",
				"src/app/layout.tsx",
				"src/app/page.tsx",
			],
			thresholds: {
				statements: 80,
				branches: 75,
				functions: 80,
				lines: 80,
			},
		},
	},
});
