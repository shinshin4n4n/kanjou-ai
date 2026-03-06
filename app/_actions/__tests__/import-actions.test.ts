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
import { importTransactions } from "@/app/_actions/import-actions";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ImportTransactionsInput } from "@/lib/validators/import";

const mockRevalidatePath = vi.mocked(revalidatePath);
const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);

function mockAuthSuccess() {
	mockRequireAuth.mockResolvedValue({
		success: true,
		data: { id: "user-123" } as never,
	});
}

const validInput: ImportTransactionsInput = {
	transactions: [
		{ date: "2026-01-15", description: "テスト取引1", amount: 1000 },
		{ date: "2026-01-16", description: "テスト取引2", amount: 2000 },
	],
	fileName: "test.csv",
	fileSize: 1024,
	csvFormat: "generic",
};

interface MockResult {
	data?: unknown;
	error: { code: string; message: string } | null;
}

function createImportMock(options: {
	logInsertResult: MockResult;
	txInsertResult?: { error: { code: string; message: string } | null };
	logUpdateResult?: { error: { code: string; message: string } | null };
}) {
	const logInsertChain: Record<string, ReturnType<typeof vi.fn>> = {};
	logInsertChain.insert = vi.fn().mockReturnValue(logInsertChain);
	logInsertChain.select = vi.fn().mockReturnValue(logInsertChain);
	logInsertChain.single = vi.fn().mockResolvedValue(options.logInsertResult);

	const logUpdateChain: Record<string, ReturnType<typeof vi.fn>> = {};
	logUpdateChain.update = vi.fn().mockReturnValue(logUpdateChain);
	logUpdateChain.eq = vi.fn().mockResolvedValue(options.logUpdateResult ?? { error: null });

	const txInsertChain: Record<string, ReturnType<typeof vi.fn>> = {};
	txInsertChain.insert = vi.fn().mockResolvedValue(options.txInsertResult ?? { error: null });

	let importLogsCallCount = 0;
	const mockFrom = vi.fn().mockImplementation((table: string) => {
		if (table === "import_logs") {
			importLogsCallCount++;
			return importLogsCallCount === 1 ? logInsertChain : logUpdateChain;
		}
		if (table === "transactions") return txInsertChain;
		return {};
	});

	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { mockFrom, logInsertChain, logUpdateChain, txInsertChain };
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("importTransactions", () => {
	it("正常にインポートできる", async () => {
		mockAuthSuccess();
		const { mockFrom, logUpdateChain } = createImportMock({
			logInsertResult: {
				data: { id: "log-1", user_id: "user-123" },
				error: null,
			},
		});

		const result = await importTransactions(validInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.importLogId).toBe("log-1");
			expect(result.data.importedCount).toBe(2);
		}
		expect(mockFrom).toHaveBeenCalledWith("import_logs");
		expect(mockFrom).toHaveBeenCalledWith("transactions");
		expect(logUpdateChain.update).toHaveBeenCalledWith(
			expect.objectContaining({ status: "completed", success_count: 2 }),
		);
	});

	it("未認証の場合UNAUTHORIZEDを返す", async () => {
		mockRequireAuth.mockResolvedValue({
			success: false,
			error: "ログインが必要です。",
			code: "UNAUTHORIZED",
		});

		const result = await importTransactions(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("空の取引配列でバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await importTransactions({
			...validInput,
			transactions: [],
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("1001件超過でバリデーションエラーを返す", async () => {
		mockAuthSuccess();
		const tooMany = Array.from({ length: 1001 }, (_, i) => ({
			date: "2026-01-01",
			description: `取引${i}`,
			amount: 100,
		}));

		const result = await importTransactions({
			...validInput,
			transactions: tooMany,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("import_log挿入失敗時にエラーを返す", async () => {
		mockAuthSuccess();
		createImportMock({
			logInsertResult: {
				data: null,
				error: { code: "23505", message: "duplicate" },
			},
		});

		const result = await importTransactions(validInput);

		expect(result.success).toBe(false);
	});

	it("transactions挿入失敗時にimport_logをfailedに更新する", async () => {
		mockAuthSuccess();
		const { logUpdateChain } = createImportMock({
			logInsertResult: {
				data: { id: "log-1", user_id: "user-123" },
				error: null,
			},
			txInsertResult: {
				error: { code: "23505", message: "constraint violation" },
			},
		});

		const result = await importTransactions(validInput);

		expect(result.success).toBe(false);
		expect(logUpdateChain.update).toHaveBeenCalledWith(
			expect.objectContaining({ status: "failed" }),
		);
	});

	it("成功時にrevalidatePathを呼ぶ", async () => {
		mockAuthSuccess();
		createImportMock({
			logInsertResult: {
				data: { id: "log-1", user_id: "user-123" },
				error: null,
			},
		});

		await importTransactions(validInput);

		expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
	});

	it("デフォルト勘定科目とsourceが正しく設定される", async () => {
		mockAuthSuccess();
		const { txInsertChain } = createImportMock({
			logInsertResult: {
				data: { id: "log-1", user_id: "user-123" },
				error: null,
			},
		});

		await importTransactions(validInput);

		const insertedRows = txInsertChain.insert.mock.calls[0][0];
		expect(insertedRows[0]).toEqual(
			expect.objectContaining({
				debit_account: "EXP010",
				credit_account: "AST002",
				source: "csv_import",
				import_log_id: "log-1",
			}),
		);
	});

	it("import_logがcompletedに更新される", async () => {
		mockAuthSuccess();
		const { logUpdateChain } = createImportMock({
			logInsertResult: {
				data: { id: "log-1", user_id: "user-123" },
				error: null,
			},
		});

		await importTransactions(validInput);

		expect(logUpdateChain.update).toHaveBeenCalledWith({
			status: "completed",
			success_count: 2,
		});
		expect(logUpdateChain.eq).toHaveBeenCalledWith("id", "log-1");
	});
});
