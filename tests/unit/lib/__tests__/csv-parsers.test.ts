import { describe, expect, it } from "vitest";
import {
	detectCsvFormat,
	normalizeDate,
	parseAmount,
} from "@/lib/csv/parsers";

describe("CSV パーサー", () => {
	describe("detectCsvFormat", () => {
		it("Wise形式を検出する", () => {
			const headers = [
				"TransferWise ID",
				"Date",
				"Amount",
				"Currency",
				"Description",
			];
			expect(detectCsvFormat(headers)).toBe("wise");
		});

		it("Revolut形式を検出する", () => {
			const headers = ["Date", "Description", "Amount", "Currency", "Balance"];
			expect(detectCsvFormat(headers)).toBe("revolut");
		});

		it("汎用形式にフォールバックする", () => {
			const headers = ["日付", "摘要", "金額"];
			expect(detectCsvFormat(headers)).toBe("generic");
		});

		it("ヘッダーの前後空白を無視する", () => {
			const headers = [" TransferWise ID ", "Date", "Amount"];
			expect(detectCsvFormat(headers)).toBe("wise");
		});

		it("大文字小文字を無視する", () => {
			const headers = ["date", "description", "amount", "currency", "balance"];
			expect(detectCsvFormat(headers)).toBe("revolut");
		});
	});

	describe("normalizeDate", () => {
		it("DD-MM-YYYY をYYYY-MM-DDに変換", () => {
			expect(normalizeDate("15-01-2025")).toBe("2025-01-15");
		});

		it("DD/MM/YYYY をYYYY-MM-DDに変換", () => {
			expect(normalizeDate("15/01/2025")).toBe("2025-01-15");
		});

		it("YYYY-MM-DD はそのまま返す", () => {
			expect(normalizeDate("2025-01-15")).toBe("2025-01-15");
		});

		it("ISO形式から日付部分を抽出", () => {
			expect(normalizeDate("2025-01-15T10:30:00Z")).toBe("2025-01-15");
		});

		it("1桁の日/月をゼロパディング", () => {
			expect(normalizeDate("5-1-2025")).toBe("2025-01-05");
		});
	});

	describe("parseAmount", () => {
		it("整数文字列をパースする", () => {
			expect(parseAmount("5000")).toBe(5000);
		});

		it("カンマ区切りを処理する", () => {
			expect(parseAmount("1,500")).toBe(1500);
		});

		it("負の値を処理する", () => {
			expect(parseAmount("-3000")).toBe(-3000);
		});

		it("小数を四捨五入する", () => {
			expect(parseAmount("1500.7")).toBe(1501);
		});

		it("空白を除去する", () => {
			expect(parseAmount(" 5000 ")).toBe(5000);
		});

		it("不正な値でエラーを投げる", () => {
			expect(() => parseAmount("abc")).toThrow("Invalid amount");
		});
	});
});
