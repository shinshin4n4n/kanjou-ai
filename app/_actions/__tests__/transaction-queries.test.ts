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

import {
	getTransaction,
	getTransactions,
	type PaginatedTransactions,
} from "@/app/_actions/transaction-queries";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);

interface ChainMockResult {
	data: unknown[] | null;
	count: number | null;
	error: { code: string; message: string } | null;
}

interface MutationMockResult {
	data: unknown | null;
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

function createMutationMock(result: MutationMockResult) {
	const mock: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["insert", "update", "select", "eq"]) {
		mock[method] = vi.fn().mockReturnValue(mock);
	}
	mock.single = vi.fn().mockResolvedValue(result);
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

const TEST_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("transaction-queries", () => {
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

	describe("getTransaction", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("正常に取引を取得できる", async () => {
			mockAuthSuccess();
			createMutationMock({ data: sampleTransaction, error: null });

			const result = await getTransaction(TEST_UUID);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.id).toBe("txn-1");
			}
		});

		it("存在しない取引でエラーを返す", async () => {
			mockAuthSuccess();
			createMutationMock({
				data: null,
				error: { code: "PGRST116", message: "not found" },
			});

			const result = await getTransaction(TEST_UUID);

			expect(result.success).toBe(false);
		});
	});

	it("PaginatedTransactions型がexportされている", () => {
		const _typeCheck: PaginatedTransactions = {
			transactions: [],
			total: 0,
			page: 1,
			perPage: 20,
		};
		expect(_typeCheck).toBeDefined();
	});
});
