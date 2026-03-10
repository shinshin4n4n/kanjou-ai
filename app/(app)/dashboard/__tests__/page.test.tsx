import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	getUser: vi.fn(),
}));

vi.mock("@/app/_actions/dashboard-actions", () => ({
	getDashboardData: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

import { redirect } from "next/navigation";
import { getDashboardData } from "@/app/_actions/dashboard-actions";
import { getUser } from "@/lib/auth";
import DashboardPage from "../page";

const mockGetUser = vi.mocked(getUser);
const mockGetDashboardData = vi.mocked(getDashboardData);
const mockRedirect = vi.mocked(redirect);

describe("DashboardPage", () => {
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
			const jsx = await DashboardPage({ searchParams: Promise.resolve({}) });
			render(jsx);
		} catch {
			// redirect throws
		}
		expect(mockRedirect).toHaveBeenCalledWith("/login");
	});

	it("エラー時にエラーメッセージが表示される", async () => {
		mockGetDashboardData.mockResolvedValue({
			success: false,
			error: "データ取得に失敗しました。",
			code: "INTERNAL_ERROR",
		});
		const jsx = await DashboardPage({ searchParams: Promise.resolve({}) });
		render(jsx);
		expect(screen.getByText("データ取得に失敗しました。")).toBeInTheDocument();
	});

	it("月次サマリーが表示される", async () => {
		mockGetDashboardData.mockResolvedValue({
			success: true,
			data: {
				month: "2026-03",
				income: 500000,
				expense: 200000,
				balance: 300000,
				expenseBreakdown: [],
				unconfirmedCount: 3,
				recentImports: [],
			},
		});
		const jsx = await DashboardPage({ searchParams: Promise.resolve({}) });
		render(jsx);
		expect(screen.getByText("収入")).toBeInTheDocument();
		expect(screen.getByText("支出")).toBeInTheDocument();
		expect(screen.getByText("差額")).toBeInTheDocument();
		expect(screen.getByText("3件")).toBeInTheDocument();
	});

	it("月ナビゲーションリンクが表示される", async () => {
		mockGetDashboardData.mockResolvedValue({
			success: true,
			data: {
				month: "2026-03",
				income: 0,
				expense: 0,
				balance: 0,
				expenseBreakdown: [],
				unconfirmedCount: 0,
				recentImports: [],
			},
		});
		const jsx = await DashboardPage({ searchParams: Promise.resolve({ month: "2026-03" }) });
		render(jsx);
		const links = screen.getAllByRole("link");
		const navLinks = links.filter(
			(link) =>
				link.getAttribute("href")?.includes("month=2026-02") ||
				link.getAttribute("href")?.includes("month=2026-04"),
		);
		expect(navLinks).toHaveLength(2);
	});
});
