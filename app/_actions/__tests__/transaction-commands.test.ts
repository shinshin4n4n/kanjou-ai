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
	softDeleteTransaction,
	updateTransaction,
} from "@/app/_actions/transaction-commands";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const mockRevalidatePath = vi.mocked(revalidatePath);
const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);

interface MutationMockResult {
	data: unknown | null;
	error: { code: string; message: string } | null;
}

interface BulkMutationMockResult {
	data: unknown[] | null;
	error: { code: string; message: string } | null;
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
const TEST_UUID_2 = "550e8400-e29b-41d4-a716-446655440001";
const TEST_UUID_3 = "550e8400-e29b-41d4-a716-446655440002";

const validCreateInput = {
	transactionDate: "2026-01-15",
	description: "テスト取引",
	amount: 1000,
	debitAccount: "EXP001",
	creditAccount: "AST001",
};

describe("transaction-commands", () => {
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
	});

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

		it("無効なIDでバリデーションエラーを返す", async () => {
			mockAuthSuccess();

			const result = await softDeleteTransaction("invalid-uuid");

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.code).toBe("VALIDATION_ERROR");
			}
		});

		it("削除後にrevalidatePathが呼ばれる", async () => {
			mockAuthSuccess();
			const deleted = { ...sampleTransaction, id: TEST_UUID, deleted_at: "2026-03-01T00:00:00Z" };
			createMutationMock({ data: deleted, error: null });

			await softDeleteTransaction(TEST_UUID);

			expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
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

		it("空配列でバリデーションエラーを返す", async () => {
			mockAuthSuccess();

			const result = await bulkConfirmTransactions([]);

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
	});
});
