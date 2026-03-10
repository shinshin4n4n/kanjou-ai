import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	getUser: vi.fn(),
}));

vi.mock("@/app/_actions/transaction-actions", () => ({
	getTransactions: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

vi.mock("@/components/transaction-list-actions", () => ({
	TransactionListActions: ({ transactions }: { transactions: unknown[] }) => (
		<div data-testid="transaction-list">{transactions.length}件</div>
	),
}));

import { redirect } from "next/navigation";
import { getTransactions } from "@/app/_actions/transaction-actions";
import { getUser } from "@/lib/auth";
import type { Tables } from "@/lib/types/supabase";
import TransactionsPage from "../page";

const mockGetUser = vi.mocked(getUser);
const mockGetTransactions = vi.mocked(getTransactions);
const mockRedirect = vi.mocked(redirect);

const transactionFixture: Tables<"transactions"> = {
	id: "t-1",
	user_id: "user-1",
	transaction_date: "2026-01-01",
	description: "テスト取引",
	amount: 1000,
	debit_account: "EXP001",
	credit_account: "INC001",
	tax_category: "tax_10",
	memo: null,
	is_confirmed: false,
	source: "manual",
	import_log_id: null,
	ai_suggested: false,
	ai_confidence: null,
	original_currency: null,
	original_amount: null,
	exchange_rate: null,
	fees: null,
	deleted_at: null,
	created_at: "2026-01-01T00:00:00Z",
	updated_at: "2026-01-01T00:00:00Z",
};

describe("TransactionsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetUser.mockResolvedValue({
			id: "user-1",
			email: "test@example.com",
		} as Awaited<ReturnType<typeof getUser>>);
	});

	it("未認証の場合はログインにリダイレクトする", async () => {
		mockGetUser.mockResolvedValue(null);
		try {
			const jsx = await TransactionsPage({ searchParams: Promise.resolve({}) });
			render(jsx);
		} catch {
			// redirect throws
		}
		expect(mockRedirect).toHaveBeenCalledWith("/login");
	});

	it("エラー時にエラーメッセージが表示される", async () => {
		mockGetTransactions.mockResolvedValue({
			success: false,
			error: "検索条件を確認してください。",
			code: "VALIDATION_ERROR",
		});
		const jsx = await TransactionsPage({ searchParams: Promise.resolve({}) });
		render(jsx);
		expect(screen.getByText("検索条件を確認してください。")).toBeInTheDocument();
	});

	it("取引が0件の場合に空メッセージが表示される", async () => {
		mockGetTransactions.mockResolvedValue({
			success: true,
			data: { transactions: [], total: 0, page: 1, perPage: 20 },
		});
		const jsx = await TransactionsPage({ searchParams: Promise.resolve({}) });
		render(jsx);
		expect(screen.getByText("取引がありません。")).toBeInTheDocument();
	});

	it("新規作成リンクが表示される", async () => {
		mockGetTransactions.mockResolvedValue({
			success: true,
			data: { transactions: [], total: 0, page: 1, perPage: 20 },
		});
		const jsx = await TransactionsPage({ searchParams: Promise.resolve({}) });
		render(jsx);
		const link = screen.getByRole("link", { name: /新規作成/ });
		expect(link).toHaveAttribute("href", "/transactions/new");
	});

	it("複数ページ時にページネーションが表示される", async () => {
		mockGetTransactions.mockResolvedValue({
			success: true,
			data: {
				transactions: [transactionFixture],
				total: 40,
				page: 1,
				perPage: 20,
			},
		});
		const jsx = await TransactionsPage({ searchParams: Promise.resolve({}) });
		render(jsx);
		expect(screen.getByText("1 / 2")).toBeInTheDocument();
		expect(screen.getByText("次へ")).toBeInTheDocument();
	});
});
