import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

import { getProfile, updateProfile } from "@/app/_actions/profile";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);

function createFormData(data: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(data)) {
		fd.set(key, value);
	}
	return fd;
}

describe("updateProfile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正常にプロフィールを更新できる", async () => {
		mockRequireAuth.mockResolvedValue({
			success: true,
			data: { id: "user-123" } as never,
		});
		const mockEq = vi.fn().mockResolvedValue({ error: null });
		mockCreateClient.mockResolvedValue({
			from: vi.fn().mockReturnValue({
				update: vi.fn().mockReturnValue({ eq: mockEq }),
			}),
		} as unknown as Awaited<ReturnType<typeof createClient>>);

		const result = await updateProfile(
			createFormData({
				displayName: "テストユーザー",
				fiscalYearStart: "4",
				defaultTaxRate: "tax_10",
			}),
		);

		expect(result.success).toBe(true);
	});

	it("会計年度開始月に0を設定するとバリデーションエラー", async () => {
		mockRequireAuth.mockResolvedValue({
			success: true,
			data: { id: "user-123" } as never,
		});

		const result = await updateProfile(
			createFormData({
				displayName: "テスト",
				fiscalYearStart: "0",
				defaultTaxRate: "tax_10",
			}),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("会計年度開始月に13を設定するとバリデーションエラー", async () => {
		mockRequireAuth.mockResolvedValue({
			success: true,
			data: { id: "user-123" } as never,
		});

		const result = await updateProfile(
			createFormData({
				displayName: "テスト",
				fiscalYearStart: "13",
				defaultTaxRate: "tax_10",
			}),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("無効な税区分でバリデーションエラー", async () => {
		mockRequireAuth.mockResolvedValue({
			success: true,
			data: { id: "user-123" } as never,
		});

		const result = await updateProfile(
			createFormData({
				displayName: "テスト",
				fiscalYearStart: "1",
				defaultTaxRate: "invalid_tax",
			}),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("未認証でUNAUTHORIZEDエラーを返す", async () => {
		mockRequireAuth.mockResolvedValue({
			success: false,
			error: "ログインが必要です。",
			code: "UNAUTHORIZED",
		});

		const result = await updateProfile(
			createFormData({
				displayName: "テスト",
				fiscalYearStart: "1",
				defaultTaxRate: "tax_10",
			}),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("DB更新エラー時にエラーを返す", async () => {
		mockRequireAuth.mockResolvedValue({
			success: true,
			data: { id: "user-123" } as never,
		});
		const mockEq = vi.fn().mockResolvedValue({
			error: { code: "42501", message: "RLS violation" },
		});
		mockCreateClient.mockResolvedValue({
			from: vi.fn().mockReturnValue({
				update: vi.fn().mockReturnValue({ eq: mockEq }),
			}),
		} as unknown as Awaited<ReturnType<typeof createClient>>);

		const result = await updateProfile(
			createFormData({
				displayName: "テスト",
				fiscalYearStart: "1",
				defaultTaxRate: "tax_10",
			}),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("RLS violation");
		}
	});
});

describe("getProfile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("認証済みユーザーのプロフィールを取得できる", async () => {
		mockRequireAuth.mockResolvedValue({
			success: true,
			data: { id: "user-123" } as never,
		});
		const mockSingle = vi.fn().mockResolvedValue({
			data: {
				display_name: "テストユーザー",
				fiscal_year_start: 4,
				default_tax_rate: "tax_10",
			},
			error: null,
		});
		mockCreateClient.mockResolvedValue({
			from: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({ single: mockSingle }),
				}),
			}),
		} as unknown as Awaited<ReturnType<typeof createClient>>);

		const result = await getProfile();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.display_name).toBe("テストユーザー");
			expect(result.data.fiscal_year_start).toBe(4);
		}
	});

	it("未認証でUNAUTHORIZEDエラーを返す", async () => {
		mockRequireAuth.mockResolvedValue({
			success: false,
			error: "ログインが必要です。",
			code: "UNAUTHORIZED",
		});

		const result = await getProfile();

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});
});
