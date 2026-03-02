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

import { revalidatePath } from "next/cache";
import {
	bulkConfirmTransactions,
	confirmTransaction,
	createTransaction,
	getTransaction,
	getTransactions,
	softDeleteTransaction,
	updateTransaction,
} from "@/app/_actions/transaction-actions";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const mockRevalidatePath = vi.mocked(revalidatePath);

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

const TEST_UUID = "550e8400-e29b-41d4-a716-446655440000";

const validCreateInput = {
	transactionDate: "2026-01-15",
	description: "テスト取引",
	amount: 1000,
	debitAccount: "EXP001",
	creditAccount: "AST001",
};

describe("createTransaction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正常に取引を作成できる", async () => {
		mockAuthSuccess();
		const created = { ...sampleTransaction, id: TEST_UUID };
		const { mock } = createMutationMock({ data: created, error: null });

		const result = await createTransaction(validCreateInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.id).toBe(TEST_UUID);
		}
		expect(mock.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				transaction_date: "2026-01-15",
				description: "テスト取引",
				amount: 1000,
				debit_account: "EXP001",
				credit_account: "AST001",
				source: "manual",
			}),
		);
	});

	it("未認証でUNAUTHORIZEDエラーを返す", async () => {
		mockRequireAuth.mockResolvedValue({
			success: false,
			error: "ログインが必要です。",
			code: "UNAUTHORIZED",
		});

		const result = await createTransaction(validCreateInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("必須フィールド未入力でバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await createTransaction({
			transactionDate: "",
			description: "",
			amount: 0,
			debitAccount: "",
			creditAccount: "",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("金額に負の値でバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await createTransaction({
			...validCreateInput,
			amount: -100,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createMutationMock({
			data: null,
			error: { code: "42501", message: "RLS violation" },
		});

		const result = await createTransaction(validCreateInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("RLS violation");
		}
	});

	it("作成後にrevalidatePathが呼ばれる", async () => {
		mockAuthSuccess();
		createMutationMock({ data: sampleTransaction, error: null });

		await createTransaction(validCreateInput);

		expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
	});
});

describe("updateTransaction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正常に取引を更新できる", async () => {
		mockAuthSuccess();
		const updated = { ...sampleTransaction, description: "更新済み" };
		const { mock } = createMutationMock({ data: updated, error: null });

		const result = await updateTransaction({
			id: TEST_UUID,
			description: "更新済み",
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBe("更新済み");
		}
		expect(mock.update).toHaveBeenCalled();
		expect(mock.eq).toHaveBeenCalledWith("id", TEST_UUID);
	});

	it("無効なIDでバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await updateTransaction({
			id: "invalid-uuid",
			description: "テスト",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("部分更新ができる", async () => {
		mockAuthSuccess();
		const updated = { ...sampleTransaction, amount: 5000 };
		const { mock } = createMutationMock({ data: updated, error: null });

		const result = await updateTransaction({
			id: TEST_UUID,
			amount: 5000,
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.amount).toBe(5000);
		}
		expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ amount: 5000 }));
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createMutationMock({
			data: null,
			error: { code: "42501", message: "RLS violation" },
		});

		const result = await updateTransaction({
			id: TEST_UUID,
			description: "テスト",
		});

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

// --- Issue #12: 論理削除 + 確認フロー ---

interface BulkMutationMockResult {
	data: unknown[] | null;
	error: { code: string; message: string } | null;
}

function createBulkMutationMock(result: BulkMutationMockResult) {
	const mock: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["update", "select", "eq", "in"]) {
		mock[method] = vi.fn().mockReturnValue(mock);
	}
	mock.select = vi.fn().mockResolvedValue(result);
	const mockFrom = vi.fn().mockReturnValue(mock);

	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { mock, mockFrom };
}

const TEST_UUID_2 = "550e8400-e29b-41d4-a716-446655440001";
const TEST_UUID_3 = "550e8400-e29b-41d4-a716-446655440002";

describe("softDeleteTransaction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正常に取引を論理削除できる", async () => {
		mockAuthSuccess();
		const deleted = { ...sampleTransaction, id: TEST_UUID, deleted_at: "2026-03-01T00:00:00Z" };
		const { mock } = createMutationMock({ data: deleted, error: null });

		const result = await softDeleteTransaction(TEST_UUID);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.deleted_at).not.toBeNull();
		}
		expect(mock.update).toHaveBeenCalledWith(
			expect.objectContaining({ deleted_at: expect.any(String) }),
		);
		expect(mock.eq).toHaveBeenCalledWith("id", TEST_UUID);
	});

	it("未認証でUNAUTHORIZEDエラーを返す", async () => {
		mockRequireAuth.mockResolvedValue({
			success: false,
			error: "ログインが必要です。",
			code: "UNAUTHORIZED",
		});

		const result = await softDeleteTransaction(TEST_UUID);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("無効なIDでバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await softDeleteTransaction("invalid-uuid");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("存在しない取引でエラーを返す", async () => {
		mockAuthSuccess();
		createMutationMock({
			data: null,
			error: { code: "PGRST116", message: "not found" },
		});

		const result = await softDeleteTransaction(TEST_UUID);

		expect(result.success).toBe(false);
	});

	it("削除後にrevalidatePathが呼ばれる", async () => {
		mockAuthSuccess();
		const deleted = { ...sampleTransaction, id: TEST_UUID, deleted_at: "2026-03-01T00:00:00Z" };
		createMutationMock({ data: deleted, error: null });

		await softDeleteTransaction(TEST_UUID);

		expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createMutationMock({
			data: null,
			error: { code: "42501", message: "RLS violation" },
		});

		const result = await softDeleteTransaction(TEST_UUID);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("RLS violation");
		}
	});
});

describe("confirmTransaction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正常に取引を確認済みにできる", async () => {
		mockAuthSuccess();
		const confirmed = { ...sampleTransaction, id: TEST_UUID, is_confirmed: true };
		const { mock } = createMutationMock({ data: confirmed, error: null });

		const result = await confirmTransaction(TEST_UUID);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.is_confirmed).toBe(true);
		}
		expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ is_confirmed: true }));
		expect(mock.eq).toHaveBeenCalledWith("id", TEST_UUID);
	});

	it("未認証でUNAUTHORIZEDエラーを返す", async () => {
		mockRequireAuth.mockResolvedValue({
			success: false,
			error: "ログインが必要です。",
			code: "UNAUTHORIZED",
		});

		const result = await confirmTransaction(TEST_UUID);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("無効なIDでバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await confirmTransaction("invalid-uuid");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("存在しない取引でエラーを返す", async () => {
		mockAuthSuccess();
		createMutationMock({
			data: null,
			error: { code: "PGRST116", message: "not found" },
		});

		const result = await confirmTransaction(TEST_UUID);

		expect(result.success).toBe(false);
	});

	it("確認後にrevalidatePathが呼ばれる", async () => {
		mockAuthSuccess();
		const confirmed = { ...sampleTransaction, id: TEST_UUID, is_confirmed: true };
		createMutationMock({ data: confirmed, error: null });

		await confirmTransaction(TEST_UUID);

		expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
	});
});

describe("bulkConfirmTransactions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("複数の取引を一括で確認済みにできる", async () => {
		mockAuthSuccess();
		const ids = [TEST_UUID, TEST_UUID_2, TEST_UUID_3];
		const confirmed = ids.map((id) => ({ ...sampleTransaction, id, is_confirmed: true }));
		const { mock } = createBulkMutationMock({ data: confirmed, error: null });

		const result = await bulkConfirmTransactions(ids);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toHaveLength(3);
		}
		expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ is_confirmed: true }));
		expect(mock.in).toHaveBeenCalledWith("id", ids);
	});

	it("未認証でUNAUTHORIZEDエラーを返す", async () => {
		mockRequireAuth.mockResolvedValue({
			success: false,
			error: "ログインが必要です。",
			code: "UNAUTHORIZED",
		});

		const result = await bulkConfirmTransactions([TEST_UUID]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("空配列でバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await bulkConfirmTransactions([]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("無効なIDを含む場合にバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await bulkConfirmTransactions(["invalid-uuid"]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("一括確認後にrevalidatePathが呼ばれる", async () => {
		mockAuthSuccess();
		const confirmed = [{ ...sampleTransaction, id: TEST_UUID, is_confirmed: true }];
		createBulkMutationMock({ data: confirmed, error: null });

		await bulkConfirmTransactions([TEST_UUID]);

		expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createBulkMutationMock({
			data: null,
			error: { code: "42501", message: "RLS violation" },
		});

		const result = await bulkConfirmTransactions([TEST_UUID]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("RLS violation");
		}
	});
});
