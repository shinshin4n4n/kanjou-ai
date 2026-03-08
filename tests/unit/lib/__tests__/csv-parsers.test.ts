import { describe, expect, it } from "vitest";
import {
	detectCsvFormat,
	detectSmbcFromContent,
	normalizeDate,
	parseAmount,
	parseCsv,
	parseGenericCsv,
	parseRakutenCsv,
	parseRevolutCsv,
	parseSmbcCsv,
	parseWiseCsv,
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

		it("日本語版 Revolut ヘッダーを検出する", () => {
			const headers = [
				"種類",
				"サービス",
				"開始日",
				"完了日",
				"お取引",
				"金額",
				"手数料",
				"通貨",
				"状態",
				"残高",
			];
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
			const crlfCsv = ["太郎,1234", "2025/01/15,Amazon.co.jp,5000,1回,5000,,,"].join("\r\n");
			const result = parseSmbcCsv(crlfCsv);
			expect(result).toHaveLength(1);
			expect(result[0].amount).toBe(5000);
		});
	});

	describe("parseWiseCsv", () => {
		const wiseCsv = [
			"TransferWise ID,Date,Amount,Currency,Description,Payment Reference,Running Balance,Exchange From,Exchange To,Exchange Rate,Payer Name,Payee Name,Payee Account Number,Merchant,Card Last Four Digits,Card Holder Full Name,Attachment,Note,Total fees",
			"12345,15-01-2025,-50.00,GBP,Transfer to John,REF001,450.00,GBP,JPY,190.5,,John Doe,,,,,,,2.50",
			"12346,20-01-2025,1000.00,JPY,Salary,,1450.00,,,,Employer,,,,,,,,0",
		].join("\n");

		it("Wise CSVをパースして取引一覧を返す", () => {
			const result = parseWiseCsv(wiseCsv);
			expect(result).toHaveLength(2);
			expect(result[0].date).toBe("2025-01-15");
			expect(result[0].amount).toBe(-50);
			expect(result[0].originalCurrency).toBe("GBP");
			expect(result[0].exchangeRate).toBe(190.5);
			expect(result[0].payeeName).toBe("John Doe");
			expect(result[0].reference).toBe("REF001");
			expect(result[0].fees).toBe(3);
		});

		it("データ行が無い場合は空配列を返す", () => {
			const headerOnly =
				"TransferWise ID,Date,Amount,Currency,Description,Payment Reference,Running Balance,Exchange From,Exchange To,Exchange Rate,Payer Name,Payee Name,Payee Account Number,Merchant,Card Last Four Digits,Card Holder Full Name,Attachment,Note,Total fees";
			expect(parseWiseCsv(headerOnly)).toEqual([]);
		});

		it("必須カラムが欠けている行をスキップする", () => {
			const csvWithBadRow = [
				"TransferWise ID,Date,Amount,Currency,Description",
				"12345,15-01-2025,-50.00,GBP,Transfer",
				",,,",
			].join("\n");
			const result = parseWiseCsv(csvWithBadRow);
			expect(result).toHaveLength(1);
		});
	});

	describe("parseRevolutCsv", () => {
		const revolutCsv = [
			"Date,Description,Amount,Currency,Balance",
			"15-01-2025,Netflix,-1500,JPY,48500",
			"20-01-2025,Salary,300000,JPY,348500",
		].join("\n");

		it("Revolut CSVをパースして取引一覧を返す", () => {
			const result = parseRevolutCsv(revolutCsv);
			expect(result).toHaveLength(2);
			expect(result[0].date).toBe("2025-01-15");
			expect(result[0].description).toBe("Netflix");
			expect(result[0].amount).toBe(-1500);
			expect(result[0].originalCurrency).toBe("JPY");
		});

		it("データ行が無い場合は空配列を返す", () => {
			const headerOnly = "Date,Description,Amount,Currency,Balance";
			expect(parseRevolutCsv(headerOnly)).toEqual([]);
		});

		it("不正な金額の行をスキップする", () => {
			const csvWithBadAmount = [
				"Date,Description,Amount,Currency,Balance",
				"15-01-2025,Netflix,abc,JPY,48500",
				"20-01-2025,Salary,300000,JPY,348500",
			].join("\n");
			const result = parseRevolutCsv(csvWithBadAmount);
			expect(result).toHaveLength(1);
		});

		it("金額0の行をスキップする", () => {
			const csvWithZeroAmount = [
				"Date,Description,Amount,Currency,Balance",
				"15-01-2025,Premium Plan Fee,0,JPY,48500",
				"20-01-2025,Netflix,-1500,JPY,47000",
			].join("\n");
			const result = parseRevolutCsv(csvWithZeroAmount);
			expect(result).toHaveLength(1);
			expect(result[0].description).toBe("Netflix");
		});
	});

	describe("parseRevolutCsv（日本語版）", () => {
		const revolutJaCsv = [
			"種類,サービス,開始日,完了日,お取引,金額,手数料,通貨,状態,残高",
			"カード支払い,当座,2025-01-01 05:07:13,2025-01-02 22:11:53,Emart K.w Sepang,-1751,0,JPY,完了済み,109592",
			"チャージ,当座,2025-01-03 12:45:36,2025-01-03 12:47:46,*9092によるチャージ,100000,0,JPY,完了済み,198171",
		].join("\n");

		it("日本語版CSVをパースして取引一覧を返す", () => {
			const result = parseRevolutCsv(revolutJaCsv);
			expect(result).toHaveLength(2);
			expect(result[0].description).toBe("Emart K.w Sepang");
			expect(result[0].amount).toBe(-1751);
			expect(result[0].originalCurrency).toBe("JPY");
		});

		it("日付（YYYY-MM-DD HH:MM:SS）をYYYY-MM-DDに正規化する", () => {
			const result = parseRevolutCsv(revolutJaCsv);
			expect(result[0].date).toBe("2025-01-01");
			expect(result[1].date).toBe("2025-01-03");
		});

		it("「差し戻された」ステータスの行をスキップする", () => {
			const csvWithReverted = [
				"種類,サービス,開始日,完了日,お取引,金額,手数料,通貨,状態,残高",
				"カード支払い,当座,2025-01-02 14:19:47,,Grab,-36,0,JPY,差し戻された,",
				"カード支払い,当座,2025-01-01 05:07:13,2025-01-02 22:11:53,Emart,-1751,0,JPY,完了済み,109592",
			].join("\n");
			const result = parseRevolutCsv(csvWithReverted);
			expect(result).toHaveLength(1);
			expect(result[0].description).toBe("Emart");
		});

		it("金額0の行をスキップする", () => {
			const csvWithZeroAmount = [
				"種類,サービス,開始日,完了日,お取引,金額,手数料,通貨,状態,残高",
				"請求,当座,2025-06-01 11:48:33,2025-06-01 11:48:33,プレミアムプランの手数料,0,980,JPY,完了済み,184604",
				"カード支払い,当座,2025-01-01 05:07:13,2025-01-02 22:11:53,Netflix,-1500,0,JPY,完了済み,98500",
			].join("\n");
			const result = parseRevolutCsv(csvWithZeroAmount);
			expect(result).toHaveLength(1);
			expect(result[0].description).toBe("Netflix");
		});

		it("手数料が0以外の場合feesにマッピングする", () => {
			const csvWithFees = [
				"種類,サービス,開始日,完了日,お取引,金額,手数料,通貨,状態,残高",
				"カード支払い,当座,2025-01-01 05:07:13,2025-01-02 22:11:53,Transfer,-5000,150,JPY,完了済み,100000",
				"カード支払い,当座,2025-01-01 06:00:00,2025-01-02 22:11:53,Netflix,-1500,0,JPY,完了済み,98500",
			].join("\n");
			const result = parseRevolutCsv(csvWithFees);
			expect(result[0].fees).toBe(150);
			expect(result[1].fees).toBeUndefined();
		});
	});

	describe("parseGenericCsv", () => {
		const genericCsv = [
			"date,description,amount",
			"2025-01-15,通信費,5000",
			"2025-01-20,交通費,1200",
		].join("\n");

		it("汎用CSVをパースして取引一覧を返す", () => {
			const result = parseGenericCsv(genericCsv);
			expect(result).toHaveLength(2);
			expect(result[0].date).toBe("2025-01-15");
			expect(result[0].description).toBe("通信費");
			expect(result[0].amount).toBe(5000);
		});

		it("データ行が無い場合は空配列を返す", () => {
			const headerOnly = "date,description,amount";
			expect(parseGenericCsv(headerOnly)).toEqual([]);
		});

		it("不正な金額の行をスキップする", () => {
			const csvWithBadAmount = [
				"date,description,amount",
				"2025-01-15,通信費,abc",
				"2025-01-20,交通費,1200",
			].join("\n");
			const result = parseGenericCsv(csvWithBadAmount);
			expect(result).toHaveLength(1);
		});
	});

	describe("parseCsv（統一ディスパッチャー）", () => {
		it("Wise CSVを自動判定してパースする", () => {
			const wiseCsv = [
				"TransferWise ID,Date,Amount,Currency,Description",
				"12345,15-01-2025,-50.00,GBP,Transfer",
			].join("\n");
			const result = parseCsv(wiseCsv);
			expect(result.format).toBe("wise");
			expect(result.transactions).toHaveLength(1);
		});

		it("Revolut CSVを自動判定してパースする", () => {
			const revolutCsv = [
				"Date,Description,Amount,Currency,Balance",
				"15-01-2025,Netflix,-1500,JPY,48500",
			].join("\n");
			const result = parseCsv(revolutCsv);
			expect(result.format).toBe("revolut");
			expect(result.transactions).toHaveLength(1);
		});

		it("SMBC CSVを内容ベースで自動判定してパースする", () => {
			const smbcCsv = ["太郎,1234", "2025/01/15,Amazon.co.jp,5000,1回,5000,,,"].join("\n");
			const result = parseCsv(smbcCsv);
			expect(result.format).toBe("smbc");
			expect(result.transactions).toHaveLength(1);
		});

		it("汎用CSVにフォールバックする", () => {
			const genericCsv = ["date,description,amount", "2025-01-15,通信費,5000"].join("\n");
			const result = parseCsv(genericCsv);
			expect(result.format).toBe("generic");
			expect(result.transactions).toHaveLength(1);
		});

		it("空のCSVで空配列を返す", () => {
			const result = parseCsv("");
			expect(result.format).toBe("generic");
			expect(result.transactions).toEqual([]);
		});

		it("日本語版 Revolut CSVを自動判定してパースする", () => {
			const revolutJaCsv = [
				"種類,サービス,開始日,完了日,お取引,金額,手数料,通貨,状態,残高",
				"カード支払い,当座,2025-01-01 05:07:13,2025-01-02 22:11:53,Netflix,-1500,0,JPY,完了済み,48500",
			].join("\n");
			const result = parseCsv(revolutJaCsv);
			expect(result.format).toBe("revolut");
			expect(result.transactions).toHaveLength(1);
		});
	});
});
