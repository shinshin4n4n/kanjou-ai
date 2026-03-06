import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

import { exportTransactions } from "@/app/_actions/export-actions";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ExportRequestInput } from "@/lib/validators/transaction";

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);

function mockAuthSuccess() {
	mockRequireAuth.mockResolvedValue({
		success: true,
		data: { id: "user-123" } as never,
	});
}

const validInput: ExportRequestInput = {
	format: "yayoi",
	startDate: "2026-01-01",
	endDate: "2026-01-31",
	confirmedOnly: true,
};

const sampleRows = [
	{
		transaction_date: "2026-01-15",
		description: "AWS利用料",
		amount: 5000,
		debit_account: "EXP001",
		credit_account: "AST002",
		tax_category: "tax_10",
	},
];

function createExportMock(result: {
	data: unknown[] | null;
	error: { code: string; message: string } | null;
}) {
	const chain: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "gte", "lte", "eq"]) {
		chain[method] = vi.fn().mockReturnValue(chain);
	}
	chain.order = vi.fn().mockResolvedValue(result);
	const mockFrom = vi.fn().mockReturnValue(chain);

	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { chain, mockFrom };
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("exportTransactions", () => {
	it("正常にCSVエクスポートできる", async () => {
		mockAuthSuccess();
		createExportMock({ data: sampleRows, error: null });

		const result = await exportTransactions(validInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.csv).toContain("仕訳日付");
			expect(result.data.count).toBe(1);
		}
	});

	it("未認証の場合UNAUTHORIZEDを返す", async () => {
		mockRequireAuth.mockResolvedValue({
			success: false,
			error: "ログインが必要です。",
			code: "UNAUTHORIZED",
		});

		const result = await exportTransactions(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("不正な入力でVALIDATION_ERRORを返す", async () => {
		mockAuthSuccess();

		const result = await exportTransactions({
			...validInput,
			format: "invalid" as ExportRequestInput["format"],
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("confirmedOnly=trueでis_confirmedフィルタが適用される", async () => {
		mockAuthSuccess();
		const { chain } = createExportMock({ data: sampleRows, error: null });

		await exportTransactions({ ...validInput, confirmedOnly: true });

		expect(chain.eq).toHaveBeenCalledWith("is_confirmed", true);
	});

	it("対象データ0件でEXPORT_ERRORを返す", async () => {
		mockAuthSuccess();
		createExportMock({ data: [], error: null });

		const result = await exportTransactions(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("EXPORT_ERROR");
		}
	});

	it("DBエラー時にエラーを返す", async () => {
		mockAuthSuccess();
		createExportMock({
			data: null,
			error: { code: "42P01", message: "relation does not exist" },
		});

		const result = await exportTransactions(validInput);

		expect(result.success).toBe(false);
	});
});
