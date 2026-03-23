import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => currentSearchParams,
}));

import { TransactionSearchInput } from "../transaction-search-input";

describe("TransactionSearchInput", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		currentSearchParams = new URLSearchParams();
	});

	it("検索入力欄が表示される", () => {
		render(<TransactionSearchInput />);
		expect(screen.getByPlaceholderText("摘要で検索...")).toBeInTheDocument();
	});

	it("URLパラメータから初期値が設定される", () => {
		currentSearchParams = new URLSearchParams("search=AWS");
		render(<TransactionSearchInput />);
		expect(screen.getByPlaceholderText("摘要で検索...")).toHaveValue("AWS");
	});

	it("Enterキーで検索が実行される", () => {
		render(<TransactionSearchInput />);
		const input = screen.getByPlaceholderText("摘要で検索...");
		fireEvent.change(input, { target: { value: "テスト" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(mockPush).toHaveBeenCalledWith("?search=%E3%83%86%E3%82%B9%E3%83%88&page=1");
	});

	it("検索ボタンクリックで検索が実行される", () => {
		render(<TransactionSearchInput />);
		const input = screen.getByPlaceholderText("摘要で検索...");
		fireEvent.change(input, { target: { value: "AWS" } });
		fireEvent.click(screen.getByRole("button", { name: "検索" }));
		expect(mockPush).toHaveBeenCalledWith("?search=AWS&page=1");
	});

	it("空文字で検索するとsearchパラメータが削除される", () => {
		currentSearchParams = new URLSearchParams("search=AWS&page=2");
		render(<TransactionSearchInput />);
		const input = screen.getByPlaceholderText("摘要で検索...");
		fireEvent.change(input, { target: { value: "" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(mockPush).toHaveBeenCalledWith("?page=1");
	});

	it("既存のURLパラメータが保持される", () => {
		currentSearchParams = new URLSearchParams("isConfirmed=true&page=3");
		render(<TransactionSearchInput />);
		const input = screen.getByPlaceholderText("摘要で検索...");
		fireEvent.change(input, { target: { value: "電車" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("search=%E9%9B%BB%E8%BB%8A"));
		expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("isConfirmed=true"));
		expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=1"));
	});
});
