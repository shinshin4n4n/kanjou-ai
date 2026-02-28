import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "."),
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./tests/setup.ts"],
		// TubeReview方式: __tests__/ ディレクトリに配置
		include: [
			"lib/**/__tests__/**/*.test.ts",
			"lib/**/__tests__/**/*.test.tsx",
			"app/**/__tests__/**/*.test.ts",
			"app/**/__tests__/**/*.test.tsx",
			"tests/unit/**/*.test.ts",
			"tests/integration/**/*.test.ts",
		],
		exclude: ["tests/e2e/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "text-summary", "json", "html"],
			include: ["lib/**/*.ts", "lib/**/*.tsx", "app/**/*.ts", "app/**/*.tsx"],
			exclude: [
				"lib/types/**",
				"lib/**/*.d.ts",
				"lib/utils/constants.ts",
				"lib/supabase/**",
				"app/**/page.tsx",
				"app/**/layout.tsx",
				"app/**/route.ts",
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
