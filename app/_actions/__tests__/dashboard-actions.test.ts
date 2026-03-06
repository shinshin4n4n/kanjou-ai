import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

import { getDashboardData } from "@/app/_actions/dashboard-actions";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);

function mockAuthSuccess() {
	mockRequireAuth.mockResolvedValue({
		success: true,
		data: { id: "user-123" } as never,
	});
}

function mockAuthFailure() {
	mockRequireAuth.mockResolvedValue({
		success: false,
		error: "ログインが必要です。",
		code: "UNAUTHORIZED",
	});
}

type TransactionRow = {
	amount: number;
	debit_account: string;
	credit_account: string;
	is_confirmed: boolean;
};

type ImportLogRow = {
	id: string;
	file_name: string;
	status: string;
	row_count: number | null;
	created_at: string;
};

function createSupabaseMock(
	transactionsResult: {
		data: TransactionRow[] | null;
		error: { code: string; message: string } | null;
	},
	importLogsResult: {
		data: ImportLogRow[] | null;
		error: { code: string; message: string } | null;
	},
) {
	const transactionsMock: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "gte", "lte", "is"]) {
		transactionsMock[method] = vi.fn().mockReturnValue(transactionsMock);
	}
	// Final method in chain resolves the result
	transactionsMock.is = vi.fn().mockResolvedValue(transactionsResult);

	const importLogsMock: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "order"]) {
		importLogsMock[method] = vi.fn().mockReturnValue(importLogsMock);
	}
	importLogsMock.limit = vi.fn().mockResolvedValue(importLogsResult);

	const mockFrom = vi.fn().mockImplementation((table: string) => {
		if (table === "transactions") return transactionsMock;
		if (table === "import_logs") return importLogsMock;
		return transactionsMock;
	});

	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { transactionsMock, importLogsMock, mockFrom };
}

describe("getDashboardData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("月次集計が正しく計算される（income/expense/balance）", async () => {
		mockAuthSuccess();
		createSupabaseMock(
			{
				data: [
					{ amount: 100000, debit_account: "AST002", credit_account: "INC001", is_confirmed: true },
					{ amount: 50000, debit_account: "AST002", credit_account: "INC002", is_confirmed: true },
					{ amount: 5000, debit_account: "EXP001", credit_account: "AST002", is_confirmed: true },
					{ amount: 3000, debit_account: "EXP003", credit_account: "AST002", is_confirmed: true },
				],
				error: null,
			},
			{ data: [], error: null },
		);

		const result = await getDashboardData({ month: "2026-03" });

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.income).toBe(150000);
		expect(result.data.expense).toBe(8000);
		expect(result.data.balance).toBe(142000);
		expect(result.data.month).toBe("2026-03");
	});

	it("科目別内訳が正しく集計される", async () => {
		mockAuthSuccess();
		createSupabaseMock(
			{
				data: [
					{ amount: 5000, debit_account: "EXP001", credit_account: "AST002", is_confirmed: true },
					{ amount: 2000, debit_account: "EXP001", credit_account: "AST002", is_confirmed: true },
					{ amount: 3000, debit_account: "EXP003", credit_account: "AST002", is_confirmed: true },
				],
				error: null,
			},
			{ data: [], error: null },
		);

		const result = await getDashboardData({ month: "2026-03" });

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.expenseBreakdown).toHaveLength(2);

		const commFee = result.data.expenseBreakdown.find((e) => e.code === "EXP001");
		expect(commFee).toEqual({ code: "EXP001", name: "通信費", amount: 7000 });

		const travelFee = result.data.expenseBreakdown.find((e) => e.code === "EXP003");
		expect(travelFee).toEqual({ code: "EXP003", name: "旅費交通費", amount: 3000 });
	});

	it("未確認件数が正しくカウントされる", async () => {
		mockAuthSuccess();
		createSupabaseMock(
			{
				data: [
					{ amount: 5000, debit_account: "EXP001", credit_account: "AST002", is_confirmed: true },
					{ amount: 3000, debit_account: "EXP003", credit_account: "AST002", is_confirmed: false },
					{
						amount: 100000,
						debit_account: "AST002",
						credit_account: "INC001",
						is_confirmed: false,
					},
				],
				error: null,
			},
			{ data: [], error: null },
		);

		const result = await getDashboardData({ month: "2026-03" });

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.unconfirmedCount).toBe(2);
	});

	it("インポート履歴が取得される", async () => {
		mockAuthSuccess();
		const imports: ImportLogRow[] = [
			{
				id: "imp-1",
				file_name: "bank_202603.csv",
				status: "completed",
				row_count: 10,
				created_at: "2026-03-01T00:00:00Z",
			},
			{
				id: "imp-2",
				file_name: "card_202603.csv",
				status: "failed",
				row_count: null,
				created_at: "2026-03-02T00:00:00Z",
			},
		];
		createSupabaseMock({ data: [], error: null }, { data: imports, error: null });

		const result = await getDashboardData({ month: "2026-03" });

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.recentImports).toHaveLength(2);
		expect(result.data.recentImports[0]).toEqual({
			id: "imp-1",
			fileName: "bank_202603.csv",
			status: "completed",
			rowCount: 10,
			createdAt: "2026-03-01T00:00:00Z",
		});
	});

	it("未認証の場合UNAUTHORIZEDエラーを返す", async () => {
		mockAuthFailure();

		const result = await getDashboardData({ month: "2026-03" });

		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.code).toBe("UNAUTHORIZED");
	});

	it("取引0件の場合、全て0/空配列を返す", async () => {
		mockAuthSuccess();
		createSupabaseMock({ data: [], error: null }, { data: [], error: null });

		const result = await getDashboardData({ month: "2026-03" });

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.income).toBe(0);
		expect(result.data.expense).toBe(0);
		expect(result.data.balance).toBe(0);
		expect(result.data.expenseBreakdown).toEqual([]);
		expect(result.data.unconfirmedCount).toBe(0);
		expect(result.data.recentImports).toEqual([]);
	});
});
