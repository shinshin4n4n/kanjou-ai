import { describe, expect, it } from "vitest";

async function loadConfig(): Promise<Record<string, unknown>> {
	const { default: config } = await import("../../../../lint-staged.config.js");
	return config as Record<string, unknown>;
}

describe("lint-staged config", () => {
	it("設定ファイルが正しいオブジェクト構造をエクスポートする", async () => {
		const config = await loadConfig();
		expect(config).toBeDefined();
		expect(typeof config).toBe("object");
	});

	it("TS/JS/CSSファイルに biome check --write が設定されている", async () => {
		const config = await loadConfig();
		const biomeCommands = config["*.{ts,tsx,js,jsx,css}"];
		expect(biomeCommands).toBeDefined();
		expect(biomeCommands).toContain("biome check --write");
	});

	it("TS/TSXファイルに tsc --noEmit が関数形式で設定されている", async () => {
		const config = await loadConfig();
		const tscCommands = config["*.{ts,tsx}"] as unknown[];
		expect(tscCommands).toBeDefined();

		const tscFn = tscCommands.find((entry) => typeof entry === "function") as
			| (() => string)
			| undefined;
		expect(tscFn).toBeDefined();
		expect(tscFn?.()).toBe("tsc --noEmit");
	});
});
