import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/_actions/export-actions", () => ({
	exportTransactions: vi.fn(),
}));

import { exportTransactions } from "@/app/_actions/export-actions";
import ExportPage from "../page";

const mockExportTransactions = vi.mocked(exportTransactions);

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal(
		"URL",
		Object.assign(globalThis.URL, {
			createObjectURL: vi.fn().mockReturnValue("blob:test"),
			revokeObjectURL: vi.fn(),
		}),
	);
});

describe("ExportPage", () => {
	it("タイトルとダウンロードボタンが表示される", () => {
		render(<ExportPage />);
		expect(screen.getByText("CSVエクスポート")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "ダウンロード" })).toBeInTheDocument();
	});

	it("出力形式のセレクトが表示される", () => {
		render(<ExportPage />);
		expect(screen.getByText("出力形式")).toBeInTheDocument();
		expect(screen.getByRole("combobox")).toBeInTheDocument();
	});

	it("開始日と終了日の入力フィールドが表示される", () => {
		render(<ExportPage />);
		expect(screen.getByLabelText("開始日")).toBeInTheDocument();
		expect(screen.getByLabelText("終了日")).toBeInTheDocument();
	});

	it("日付入力を変更できる", () => {
		render(<ExportPage />);
		const startDate = screen.getByLabelText("開始日");
		fireEvent.change(startDate, { target: { value: "2026-04-01" } });
		expect(startDate).toHaveValue("2026-04-01");

		const endDate = screen.getByLabelText("終了日");
		fireEvent.change(endDate, { target: { value: "2026-04-30" } });
		expect(endDate).toHaveValue("2026-04-30");
	});

	it("確認済みのみチェックボックスがデフォルトでチェックされている", () => {
		render(<ExportPage />);
		const checkbox = screen.getByLabelText("確認済みデータのみ");
		expect(checkbox).toBeChecked();
	});

	it("確認済みのみチェックボックスを切り替えられる", () => {
		render(<ExportPage />);
		const checkbox = screen.getByLabelText("確認済みデータのみ");
		fireEvent.click(checkbox);
		expect(checkbox).not.toBeChecked();
	});

	it("ダウンロードボタンクリックでServer Actionが呼ばれる", async () => {
		mockExportTransactions.mockResolvedValue({
			success: true,
			data: { csv: "\uFEFFtest", count: 1 },
		});

		render(<ExportPage />);
		fireEvent.click(screen.getByRole("button", { name: "ダウンロード" }));

		await waitFor(() => {
			expect(mockExportTransactions).toHaveBeenCalledWith(
				expect.objectContaining({
					format: "yayoi",
					confirmedOnly: true,
				}),
			);
		});
	});

	it("エクスポート成功時にBlobダウンロードが実行される", async () => {
		mockExportTransactions.mockResolvedValue({
			success: true,
			data: { csv: "\uFEFFtest", count: 1 },
		});

		render(<ExportPage />);
		fireEvent.click(screen.getByRole("button", { name: "ダウンロード" }));

		await waitFor(() => {
			expect(URL.createObjectURL).toHaveBeenCalled();
			expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
		});
	});

	it("Server Actionがエラーを返した場合メッセージを表示する", async () => {
		mockExportTransactions.mockResolvedValue({
			success: false,
			error: "エクスポート対象の取引がありません。",
			code: "EXPORT_ERROR",
		});

		render(<ExportPage />);
		fireEvent.click(screen.getByRole("button", { name: "ダウンロード" }));

		await waitFor(() => {
			expect(screen.getByText("エクスポート対象の取引がありません。")).toBeInTheDocument();
		});
	});

	it("例外発生時にフォールバックエラーメッセージを表示する", async () => {
		mockExportTransactions.mockRejectedValue(new Error("network error"));

		render(<ExportPage />);
		fireEvent.click(screen.getByRole("button", { name: "ダウンロード" }));

		await waitFor(() => {
			expect(screen.getByText("エクスポート中にエラーが発生しました。")).toBeInTheDocument();
		});
	});

	it("ローディング中はボタンが無効化される", async () => {
		let resolveExport: (value: Awaited<ReturnType<typeof exportTransactions>>) => void = () => {};
		mockExportTransactions.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveExport = resolve;
				}),
		);

		render(<ExportPage />);
		fireEvent.click(screen.getByRole("button", { name: "ダウンロード" }));

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "エクスポート中..." })).toBeDisabled();
		});

		resolveExport({ success: true, data: { csv: "test", count: 1 } });

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "ダウンロード" })).toBeEnabled();
		});
	});
});
