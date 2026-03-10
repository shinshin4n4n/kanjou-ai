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
import TransactionsPage from "../page";

const mockGetUser = vi.mocked(getUser);
const mockGetTransactions = vi.mocked(getTransactions);
const mockRedirect = vi.mocked(redirect);

beforeEach(() => {
	vi.clearAllMocks();
	mockGetUser.mockResolvedValue({ id: "user-1", email: "test@example.com" } as ReturnType<
		typeof getUser
	> extends Promise<infer T>
		? T
		: never);
});

describe("TransactionsPage", () => {
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
				transactions: [{ id: "t-1" }] as never[],
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
