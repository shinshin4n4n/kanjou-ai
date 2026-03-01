import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

import { getTransactions } from "@/app/_actions/transaction-actions";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);

interface ChainMockResult {
	data: unknown[] | null;
	count: number | null;
	error: { code: string; message: string } | null;
}

function createChainMock(result: ChainMockResult) {
	const mock: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "gte", "lte", "eq", "or", "order"]) {
		mock[method] = vi.fn().mockReturnValue(mock);
	}
	mock.range = vi.fn().mockResolvedValue(result);
	const mockFrom = vi.fn().mockReturnValue(mock);

	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { mock, mockFrom };
}

function mockAuthSuccess() {
	mockRequireAuth.mockResolvedValue({
		success: true,
		data: { id: "user-123" } as never,
	});
}

const sampleTransaction = {
	id: "txn-1",
	user_id: "user-123",
	transaction_date: "2026-01-15",
	description: "テスト取引",
	amount: 1000,
	debit_account: "EXP001",
	credit_account: "AST001",
	tax_category: "tax_10",
	ai_confidence: null,
	ai_suggested: false,
	is_confirmed: false,
	memo: null,
	original_amount: null,
	original_currency: null,
	exchange_rate: null,
	fees: null,
	source: "manual",
	import_log_id: null,
	created_at: "2026-01-15T00:00:00Z",
	updated_at: "2026-01-15T00:00:00Z",
	deleted_at: null,
};

describe("getTransactions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("未認証でUNAUTHORIZEDエラーを返す", async () => {
		mockRequireAuth.mockResolvedValue({
			success: false,
			error: "ログインが必要です。",
			code: "UNAUTHORIZED",
		});

		const result = await getTransactions({});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("デフォルトパラメータで取引一覧を取得できる", async () => {
		mockAuthSuccess();
		const { mock } = createChainMock({
			data: [sampleTransaction],
			count: 1,
			error: null,
		});

		const result = await getTransactions({});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.transactions).toHaveLength(1);
			expect(result.data.total).toBe(1);
			expect(result.data.page).toBe(1);
			expect(result.data.perPage).toBe(20);
		}
		expect(mock.select).toHaveBeenCalledWith("*", { count: "exact" });
		expect(mock.order).toHaveBeenCalledWith("transaction_date", {
			ascending: false,
		});
		expect(mock.range).toHaveBeenCalledWith(0, 19);
	});

	it("取引が0件の場合に空配列を返す", async () => {
		mockAuthSuccess();
		createChainMock({ data: [], count: 0, error: null });

		const result = await getTransactions({});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.transactions).toHaveLength(0);
			expect(result.data.total).toBe(0);
		}
	});

	it("日付範囲でフィルタできる", async () => {
		mockAuthSuccess();
		const { mock } = createChainMock({ data: [], count: 0, error: null });

		await getTransactions({
			startDate: "2026-01-01",
			endDate: "2026-03-31",
		});

		expect(mock.gte).toHaveBeenCalledWith("transaction_date", "2026-01-01");
		expect(mock.lte).toHaveBeenCalledWith("transaction_date", "2026-03-31");
	});

	it("確認済みフィルタで絞り込める", async () => {
		mockAuthSuccess();
		const { mock } = createChainMock({ data: [], count: 0, error: null });

		await getTransactions({ isConfirmed: "true" });

		expect(mock.eq).toHaveBeenCalledWith("is_confirmed", true);
	});

	it("未確認フィルタで絞り込める", async () => {
		mockAuthSuccess();
		const { mock } = createChainMock({ data: [], count: 0, error: null });

		await getTransactions({ isConfirmed: "false" });

		expect(mock.eq).toHaveBeenCalledWith("is_confirmed", false);
	});

	it("勘定科目でフィルタできる", async () => {
		mockAuthSuccess();
		const { mock } = createChainMock({ data: [], count: 0, error: null });

		await getTransactions({ accountCategory: "EXP001" });

		expect(mock.or).toHaveBeenCalledWith("debit_account.eq.EXP001,credit_account.eq.EXP001");
	});

	it("ページネーションが正しく動作する", async () => {
		mockAuthSuccess();
		const { mock } = createChainMock({ data: [], count: 50, error: null });

		const result = await getTransactions({ page: "3", perPage: "10" });

		expect(mock.range).toHaveBeenCalledWith(20, 29);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.page).toBe(3);
			expect(result.data.perPage).toBe(10);
			expect(result.data.total).toBe(50);
		}
	});

	it("無効なページ番号でバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await getTransactions({ page: "0" });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createChainMock({
			data: null,
			count: null,
			error: { code: "42501", message: "RLS violation" },
		});

		const result = await getTransactions({});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("RLS violation");
		}
	});
});
