import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	getUser: vi.fn(),
}));

vi.mock("@/app/_actions/transaction-actions", () => ({
	getTransaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

vi.mock("@/components/transaction-form", () => ({
	TransactionForm: ({ transaction }: { transaction: { id: string } }) => (
		<div data-testid="transaction-form">フォーム: {transaction.id}</div>
	),
}));

import { redirect } from "next/navigation";
import { getTransaction } from "@/app/_actions/transaction-actions";
import { getUser } from "@/lib/auth";
import type { Tables } from "@/lib/types/supabase";
import EditTransactionPage from "../page";

const mockGetUser = vi.mocked(getUser);
const mockGetTransaction = vi.mocked(getTransaction);
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

describe("EditTransactionPage", () => {
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
			const jsx = await EditTransactionPage({ params: Promise.resolve({ id: "t-1" }) });
			render(jsx);
		} catch {
			// redirect throws
		}
		expect(mockRedirect).toHaveBeenCalledWith("/login");
	});

	it("取引取得失敗時にエラーメッセージが表示される", async () => {
		mockGetTransaction.mockResolvedValue({
			success: false,
			error: "取引が見つかりません。",
			code: "INTERNAL_ERROR",
		});
		const jsx = await EditTransactionPage({ params: Promise.resolve({ id: "t-1" }) });
		render(jsx);
		expect(screen.getByText("取引が見つかりません。")).toBeInTheDocument();
	});

	it("取引取得成功時にTransactionFormが描画される", async () => {
		mockGetTransaction.mockResolvedValue({
			success: true,
			data: transactionFixture,
		});
		const jsx = await EditTransactionPage({ params: Promise.resolve({ id: "t-1" }) });
		render(jsx);
		expect(screen.getByTestId("transaction-form")).toBeInTheDocument();
		expect(screen.getByText("フォーム: t-1")).toBeInTheDocument();
	});
});
