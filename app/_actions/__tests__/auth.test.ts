import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

import { signIn, signInWithGoogle, signOut, signUp } from "@/app/_actions/auth";
import { createClient } from "@/lib/supabase/server";

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockCreateClient = vi.mocked(createClient);

beforeEach(() => {
	vi.clearAllMocks();
	mockCreateClient.mockResolvedValue({
		auth: {
			signInWithPassword: mockSignInWithPassword,
			signUp: mockSignUp,
			signOut: mockSignOut,
			signInWithOAuth: mockSignInWithOAuth,
		},
	} as unknown as Awaited<ReturnType<typeof createClient>>);
});

function createFormData(data: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(data)) {
		fd.set(key, value);
	}
	return fd;
}

describe("signIn", () => {
	it("有効な認証情報でログイン成功", async () => {
		mockSignInWithPassword.mockResolvedValue({ error: null });

		const result = await signIn(
			createFormData({ email: "test@example.com", password: "password123" }),
		);

		expect(result.success).toBe(true);
		expect(mockSignInWithPassword).toHaveBeenCalledWith({
			email: "test@example.com",
			password: "password123",
		});
	});

	it("無効な認証情報でエラーを返す", async () => {
		mockSignInWithPassword.mockResolvedValue({
			error: { message: "Invalid login credentials" },
		});

		const result = await signIn(createFormData({ email: "test@example.com", password: "wrong" }));

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
			expect(result.error).not.toContain("Invalid login credentials");
		}
	});

	it("空のメールアドレスでバリデーションエラー", async () => {
		const result = await signIn(createFormData({ email: "", password: "password123" }));

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
		expect(mockSignInWithPassword).not.toHaveBeenCalled();
	});
});

describe("signUp", () => {
	it("有効なデータでサインアップ成功", async () => {
		mockSignUp.mockResolvedValue({ error: null });

		const result = await signUp(
			createFormData({ email: "new@example.com", password: "password123" }),
		);

		expect(result.success).toBe(true);
		expect(mockSignUp).toHaveBeenCalledWith({
			email: "new@example.com",
			password: "password123",
		});
	});

	it("短いパスワードでバリデーションエラー", async () => {
		const result = await signUp(createFormData({ email: "new@example.com", password: "short" }));

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
		expect(mockSignUp).not.toHaveBeenCalled();
	});

	it("既存メールアドレスでエラーを返す", async () => {
		mockSignUp.mockResolvedValue({
			error: { message: "User already registered" },
		});

		const result = await signUp(
			createFormData({ email: "existing@example.com", password: "password123" }),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("User already registered");
		}
	});
});

describe("signInWithGoogle", () => {
	it("OAuth URLを返す", async () => {
		mockSignInWithOAuth.mockResolvedValue({
			data: { url: "https://accounts.google.com/o/oauth2/auth?..." },
			error: null,
		});

		const result = await signInWithGoogle();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.url).toContain("https://");
		}
	});

	it("OAuth エラー時にエラーを返す", async () => {
		mockSignInWithOAuth.mockResolvedValue({
			data: { url: null },
			error: { message: "OAuth provider error" },
		});

		const result = await signInWithGoogle();

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("OAuth provider error");
		}
	});
});

describe("signOut", () => {
	it("ログアウト成功", async () => {
		mockSignOut.mockResolvedValue({ error: null });

		const result = await signOut();

		expect(result.success).toBe(true);
		expect(mockSignOut).toHaveBeenCalled();
	});
});
