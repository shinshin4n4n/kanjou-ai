import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/_actions/import-actions", () => ({
	importTransactions: vi.fn(),
}));

vi.mock("@/lib/csv/parsers", () => ({
	parseCsv: vi.fn(),
}));

vi.mock("@/lib/csv/decode", () => ({
	decodeShiftJis: vi.fn().mockReturnValue(""),
}));

import { importTransactions } from "@/app/_actions/import-actions";
import { parseCsv } from "@/lib/csv/parsers";
import ImportPage from "../page";

const mockImportTransactions = vi.mocked(importTransactions);
const mockParseCsv = vi.mocked(parseCsv);

function createFile(name: string, size: number, type = "text/csv"): File {
	const content = new Uint8Array(size);
	return new File([content], name, { type });
}

function mockParseCsvResult(transactions: { date: string; description: string; amount: number }[]) {
	mockParseCsv.mockReturnValue({
		format: "generic",
		transactions,
	});
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("ImportPage", () => {
	describe("アップロードフェーズ", () => {
		it("ファイル入力とCSVインポートタイトルが表示される", () => {
			render(<ImportPage />);
			expect(screen.getByText("CSVインポート")).toBeInTheDocument();
			expect(screen.getByText(/CSV形式、最大5MB/)).toBeInTheDocument();
		});

		it("5MB超のファイルでエラーを表示する", () => {
			render(<ImportPage />);
			const input = document.querySelector("input[type='file']");
			const file = createFile("large.csv", 6 * 1024 * 1024);
			fireEvent.change(input!, { target: { files: [file] } });
			expect(screen.getByText("ファイルサイズが5MBを超えています。")).toBeInTheDocument();
		});

		it("CSV以外のMIMEタイプかつ拡張子が.csvでないファイルでエラーを表示する", () => {
			render(<ImportPage />);
			const input = document.querySelector("input[type='file']");
			const file = createFile("data.json", 100, "application/json");
			fireEvent.change(input!, { target: { files: [file] } });
			expect(screen.getByText("CSVファイルのみアップロードできます。")).toBeInTheDocument();
		});

		it(".csv拡張子のファイルはMIMEタイプに関係なく受け付ける", () => {
			mockParseCsvResult([{ date: "2026-01-15", description: "テスト", amount: 1000 }]);
			render(<ImportPage />);
			const input = document.querySelector("input[type='file']");
			const file = createFile("data.csv", 100, "");
			fireEvent.change(input!, { target: { files: [file] } });
			expect(screen.queryByText("CSVファイルのみアップロードできます。")).not.toBeInTheDocument();
		});

		it("パース結果が0件の場合エラーを表示する", async () => {
			mockParseCsv.mockReturnValue({ format: "generic", transactions: [] });
			render(<ImportPage />);
			const input = document.querySelector("input[type='file']");
			const file = createFile("empty.csv", 10);
			fireEvent.change(input!, { target: { files: [file] } });
			await waitFor(() => {
				expect(
					screen.getByText("CSVファイルから取引データを読み取れませんでした。"),
				).toBeInTheDocument();
			});
		});
	});

	describe("プレビューフェーズ", () => {
		function renderWithPreview(count = 2) {
			const txs = Array.from({ length: count }, (_, i) => ({
				date: `2026-01-${String(i + 1).padStart(2, "0")}`,
				description: `取引${i + 1}`,
				amount: (i + 1) * 1000,
			}));
			mockParseCsvResult(txs);
			render(<ImportPage />);
			const input = document.querySelector("input[type='file']");
			fireEvent.change(input!, { target: { files: [createFile("test.csv", 100)] } });
			return txs;
		}

		it("パース後にプレビューテーブルが表示される", async () => {
			renderWithPreview();
			await waitFor(() => {
				expect(screen.getByText("プレビュー")).toBeInTheDocument();
				expect(screen.getByText("2件")).toBeInTheDocument();
				expect(screen.getByText("取引1")).toBeInTheDocument();
				expect(screen.getByText("取引2")).toBeInTheDocument();
			});
		});

		it("20件超の場合に残件数を表示する", async () => {
			renderWithPreview(25);
			await waitFor(() => {
				expect(screen.getByText("25件")).toBeInTheDocument();
				expect(screen.getByText("他 5 件")).toBeInTheDocument();
			});
		});

		it("キャンセルでアップロードフェーズに戻る", async () => {
			renderWithPreview();
			await waitFor(() => {
				expect(screen.getByText("プレビュー")).toBeInTheDocument();
			});
			fireEvent.click(screen.getByText("キャンセル"));
			expect(screen.getByText("CSVインポート")).toBeInTheDocument();
		});
	});

	describe("インポート実行", () => {
		function setupPreviewAndClickImport() {
			mockParseCsvResult([{ date: "2026-01-15", description: "テスト取引", amount: 1000 }]);
			render(<ImportPage />);
			const input = document.querySelector("input[type='file']");
			fireEvent.change(input!, { target: { files: [createFile("test.csv", 100)] } });
		}

		it("成功時に結果フェーズが表示される", async () => {
			mockImportTransactions.mockResolvedValue({
				success: true,
				data: { importLogId: "log-1", importedCount: 1 },
			});
			setupPreviewAndClickImport();
			await waitFor(() => {
				expect(screen.getByText("インポート実行")).toBeInTheDocument();
			});
			fireEvent.click(screen.getByText("インポート実行"));
			await waitFor(() => {
				expect(screen.getByText("インポート完了")).toBeInTheDocument();
				expect(screen.getByText("1件の取引をインポートしました。")).toBeInTheDocument();
			});
		});

		it("失敗時にエラーメッセージを表示する", async () => {
			mockImportTransactions.mockResolvedValue({
				success: false,
				error: "インポートに失敗しました。",
				code: "INTERNAL_ERROR",
			});
			setupPreviewAndClickImport();
			await waitFor(() => {
				expect(screen.getByText("インポート実行")).toBeInTheDocument();
			});
			fireEvent.click(screen.getByText("インポート実行"));
			await waitFor(() => {
				expect(screen.getByText("インポートに失敗しました。")).toBeInTheDocument();
			});
		});

		it("予期しないエラー時にフォールバックメッセージを表示しloading状態がリセットされる", async () => {
			mockImportTransactions.mockRejectedValue(new Error("network error"));
			setupPreviewAndClickImport();
			await waitFor(() => {
				expect(screen.getByText("インポート実行")).toBeInTheDocument();
			});
			fireEvent.click(screen.getByText("インポート実行"));
			await waitFor(() => {
				expect(screen.getByText("インポート中にエラーが発生しました。")).toBeInTheDocument();
				expect(screen.getByText("インポート実行")).not.toBeDisabled();
			});
		});

		it("結果フェーズから続けてインポートでリセットされる", async () => {
			mockImportTransactions.mockResolvedValue({
				success: true,
				data: { importLogId: "log-1", importedCount: 1 },
			});
			setupPreviewAndClickImport();
			await waitFor(() => {
				expect(screen.getByText("インポート実行")).toBeInTheDocument();
			});
			fireEvent.click(screen.getByText("インポート実行"));
			await waitFor(() => {
				expect(screen.getByText("インポート完了")).toBeInTheDocument();
			});
			fireEvent.click(screen.getByText("続けてインポート"));
			expect(screen.getByText("CSVインポート")).toBeInTheDocument();
		});
	});
});
