import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("env", () => {
	const VALID_ENV = {
		NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
		NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key-dummy-value",
	};

	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
		vi.resetModules();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("有効な環境変数でenvオブジェクトを返す", async () => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = VALID_ENV.NEXT_PUBLIC_SUPABASE_URL;
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		const { env } = await import("@/lib/env");

		expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
		expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
	});

	it("NEXT_PUBLIC_SUPABASE_URLが未設定の場合エラーをスローする", async () => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		await expect(() => import("@/lib/env")).rejects.toThrow();
	});

	it("NEXT_PUBLIC_SUPABASE_ANON_KEYが未設定の場合エラーをスローする", async () => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = VALID_ENV.NEXT_PUBLIC_SUPABASE_URL;
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined;

		await expect(() => import("@/lib/env")).rejects.toThrow();
	});

	it("NEXT_PUBLIC_SUPABASE_URLが不正なURLの場合エラーをスローする", async () => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		await expect(() => import("@/lib/env")).rejects.toThrow();
	});

	it("NEXT_PUBLIC_SUPABASE_ANON_KEYが空文字の場合エラーをスローする", async () => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = VALID_ENV.NEXT_PUBLIC_SUPABASE_URL;
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";

		await expect(() => import("@/lib/env")).rejects.toThrow();
	});
});
