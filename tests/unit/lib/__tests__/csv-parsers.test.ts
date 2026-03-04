import { describe, expect, it } from "vitest";
import {
	detectCsvFormat,
	detectSmbcFromContent,
	normalizeDate,
	parseAmount,
	parseRakutenCsv,
	parseSmbcCsv,
} from "@/lib/csv/parsers";

describe("CSV パーサー", () => {
	describe("detectCsvFormat", () => {
		it("Wise形式を検出する", () => {
			const headers = ["TransferWise ID", "Date", "Amount", "Currency", "Description"];
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

	describe("detectCsvFormat - 楽天カード", () => {
		it("楽天カード形式を検出する", () => {
			const headers = [
				"利用日",
				"利用店名・商品名",
				"利用者",
				"支払方法",
				"利用金額",
				"支払手数料",
				"支払総額",
			];
			expect(detectCsvFormat(headers)).toBe("rakuten");
		});

		it("利用店名・商品名がない場合は楽天と判定しない", () => {
			const headers = ["利用日", "店名", "利用金額"];
			expect(detectCsvFormat(headers)).toBe("generic");
		});
	});

	describe("normalizeDate - YYYY/MM/DD", () => {
		it("YYYY/MM/DD をYYYY-MM-DDに変換", () => {
			expect(normalizeDate("2025/01/15")).toBe("2025-01-15");
		});

		it("YYYY/M/D の1桁月日をゼロパディング", () => {
			expect(normalizeDate("2025/1/5")).toBe("2025-01-05");
		});
	});

	describe("parseRakutenCsv", () => {
		const rakutenCsv = [
			'"利用日","利用店名・商品名","利用者","支払方法","利用金額","支払手数料","支払総額"',
			'"2025/01/15","Amazon.co.jp","本人","1回払い","3500","0","3500"',
			'"2025/01/20","コンビニエンスストア","本人","1回払い","850","0","850"',
		].join("\n");

		it("楽天カードCSVをパースして取引一覧を返す", () => {
			const result = parseRakutenCsv(rakutenCsv);
			expect(result).toHaveLength(2);
		});

		it("日付をYYYY-MM-DD形式に正規化する", () => {
			const result = parseRakutenCsv(rakutenCsv);
			expect(result[0].date).toBe("2025-01-15");
		});

		it("利用店名をdescriptionにマッピングする", () => {
			const result = parseRakutenCsv(rakutenCsv);
			expect(result[0].description).toBe("Amazon.co.jp");
		});

		it("利用金額を整数にパースする", () => {
			const result = parseRakutenCsv(rakutenCsv);
			expect(result[0].amount).toBe(3500);
			expect(result[1].amount).toBe(850);
		});

		it("空行を無視する", () => {
			const csvWithEmpty = `${rakutenCsv}\n\n`;
			const result = parseRakutenCsv(csvWithEmpty);
			expect(result).toHaveLength(2);
		});

		it("必須カラムが欠けている行をスキップする", () => {
			const csvWithBadRow = [
				'"利用日","利用店名・商品名","利用者","支払方法","利用金額","支払手数料","支払総額"',
				'"2025/01/15","Amazon.co.jp","本人","1回払い","3500","0","3500"',
				'"","","","","","",""',
			].join("\n");
			const result = parseRakutenCsv(csvWithBadRow);
			expect(result).toHaveLength(1);
		});

		it("Windows改行(CRLF)を処理する", () => {
			const crlfCsv = [
				'"利用日","利用店名・商品名","利用者","支払方法","利用金額","支払手数料","支払総額"',
				'"2025/01/15","Amazon.co.jp","本人","1回払い","3500","0","3500"',
			].join("\r\n");
			const result = parseRakutenCsv(crlfCsv);
			expect(result).toHaveLength(1);
			expect(result[0].amount).toBe(3500);
		});

		it('エスケープクォート（""）を単一の"に変換する', () => {
			const csvWithEscaped = [
				'"利用日","利用店名・商品名","利用者","支払方法","利用金額","支払手数料","支払総額"',
				'"2025/01/15","Amazon ""プライム""","本人","1回払い","500","0","500"',
			].join("\n");
			const result = parseRakutenCsv(csvWithEscaped);
			expect(result[0].description).toBe('Amazon "プライム"');
		});
	});

	describe("detectSmbcFromContent", () => {
		it("SMBC形式のCSV内容を検出する", () => {
			const lines = [
				"太郎,1234",
				"2025/01/15,Amazon.co.jp,5000,1回,5000,,,",
				"2025/01/20,コンビニ,300,1回,300,,,",
			];
			expect(detectSmbcFromContent(lines)).toBe(true);
		});

		it("1行目のカラム数が5以上の場合はSMBCと判定しない", () => {
			const lines = ["col1,col2,col3,col4,col5", "2025/01/15,Amazon.co.jp,5000,1回,5000,,,"];
			expect(detectSmbcFromContent(lines)).toBe(false);
		});

		it("2行目がYYYY/MM/DDで始まらない場合はSMBCと判定しない", () => {
			const lines = ["太郎,1234", "not-a-date,Amazon.co.jp,5000,1回,5000,,,"];
			expect(detectSmbcFromContent(lines)).toBe(false);
		});

		it("行が1行以下の場合はSMBCと判定しない", () => {
			const lines = ["太郎,1234"];
			expect(detectSmbcFromContent(lines)).toBe(false);
		});
	});

	describe("parseSmbcCsv", () => {
		const smbcCsv = [
			"太郎,1234",
			"2025/01/15,Amazon.co.jp,5000,1回,5000,,,",
			"2025/01/20,コンビニエンスストア,850,1回,850,,,",
		].join("\n");

		it("SMBC CSVをパースして取引一覧を返す", () => {
			const result = parseSmbcCsv(smbcCsv);
			expect(result).toHaveLength(2);
		});

		it("日付をYYYY-MM-DD形式に正規化する", () => {
			const result = parseSmbcCsv(smbcCsv);
			expect(result[0].date).toBe("2025-01-15");
		});

		it("利用先をdescriptionにマッピングする", () => {
			const result = parseSmbcCsv(smbcCsv);
			expect(result[0].description).toBe("Amazon.co.jp");
		});

		it("利用金額を整数にパースする", () => {
			const result = parseSmbcCsv(smbcCsv);
			expect(result[0].amount).toBe(5000);
			expect(result[1].amount).toBe(850);
		});

		it("1行目（契約者情報）をスキップする", () => {
			const result = parseSmbcCsv(smbcCsv);
			expect(result.every((t) => t.description !== "太郎")).toBe(true);
		});

		it("空行を無視する", () => {
			const csvWithEmpty = `${smbcCsv}\n\n`;
			const result = parseSmbcCsv(csvWithEmpty);
			expect(result).toHaveLength(2);
		});

		it("不正な行をスキップする", () => {
			const csvWithBadRow = ["太郎,1234", "2025/01/15,Amazon.co.jp,5000,1回,5000,,,", ",,,"].join(
				"\n",
			);
			const result = parseSmbcCsv(csvWithBadRow);
			expect(result).toHaveLength(1);
		});

		it("金額が不正な行をスキップする", () => {
			const csvWithBadAmount = [
				"太郎,1234",
				"2025/01/15,Amazon.co.jp,abc,1回,abc,,,",
				"2025/01/20,コンビニ,850,1回,850,,,",
			].join("\n");
			const result = parseSmbcCsv(csvWithBadAmount);
			expect(result).toHaveLength(1);
		});

		it("Windows改行(CRLF)を処理する", () => {
			const crlfCsv = [
				"太郎,1234",
				"2025/01/15,Amazon.co.jp,5000,1回,5000,,,",
			].join("\r\n");
			const result = parseSmbcCsv(crlfCsv);
			expect(result).toHaveLength(1);
			expect(result[0].amount).toBe(5000);
		});
	});
});
