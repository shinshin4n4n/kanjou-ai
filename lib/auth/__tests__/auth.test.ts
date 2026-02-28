import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Supabase server client をモック
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

import { getUser, requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const mockGetUser = vi.fn();
const mockCreateClient = vi.mocked(createClient);

const mockUser: Pick<
	User,
	"id" | "email" | "app_metadata" | "user_metadata" | "aud" | "created_at"
> = {
	id: "user-123",
	email: "test@example.com",
	app_metadata: {},
	user_metadata: {},
	aud: "authenticated",
	created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
	vi.clearAllMocks();
	mockCreateClient.mockResolvedValue({
		auth: { getUser: mockGetUser },
	} as unknown as Awaited<ReturnType<typeof createClient>>);
});

describe("getUser", () => {
	it("認証済みユーザーの情報を返す", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: mockUser },
			error: null,
		});

		const user = await getUser();

		expect(user).toEqual(mockUser);
	});

	it("未認証の場合 null を返す", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: null },
			error: null,
		});

		const user = await getUser();

		expect(user).toBeNull();
	});

	it("認証エラーの場合 null を返す", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: null },
			error: { message: "Invalid token", status: 401 },
		});

		const user = await getUser();

		expect(user).toBeNull();
	});
});

describe("requireAuth", () => {
	it("認証済みユーザーで ApiResponse success を返す", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: mockUser },
			error: null,
		});

		const result = await requireAuth();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.id).toBe("user-123");
			expect(result.data.email).toBe("test@example.com");
		}
	});

	it("未認証の場合 UNAUTHORIZED エラーを返す", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: null },
			error: null,
		});

		const result = await requireAuth();

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
			expect(result.error).toBe("ログインが必要です。");
		}
	});

	it("セッション切れの場合 UNAUTHORIZED エラーを返す", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: null },
			error: { message: "Session expired", status: 401 },
		});

		const result = await requireAuth();

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
			// 内部エラーメッセージが漏れないことを確認
			expect(result.error).not.toContain("Session expired");
		}
	});

	it("エラーメッセージに内部情報を含まない", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: null },
			error: { message: "JWT expired at 2026-01-01", status: 401 },
		});

		const result = await requireAuth();

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("JWT");
			expect(result.error).not.toContain("2026");
		}
	});
});
