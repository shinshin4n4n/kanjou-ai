import { describe, expect, it } from "vitest";
import {
	type ExportTransaction,
	escapeCsvField,
	formatFreee,
	formatGeneric,
	formatTransactions,
	formatYayoi,
} from "@/lib/csv/formatters";

const sampleTx: ExportTransaction = {
	transaction_date: "2026-01-15",
	description: "AWS利用料",
	amount: 5000,
	debit_account: "EXP001",
	credit_account: "AST002",
	tax_category: "tax_10",
};

const sampleTx2: ExportTransaction = {
	transaction_date: "2026-01-20",
	description: "電車代",
	amount: 320,
	debit_account: "EXP003",
	credit_account: "AST001",
	tax_category: null,
};

describe("escapeCsvField", () => {
	it("カンマを含むフィールドをダブルクォートで囲む", () => {
		expect(escapeCsvField("A,B")).toBe('"A,B"');
	});

	it("ダブルクォートをエスケープする", () => {
		expect(escapeCsvField('引用"符')).toBe('"引用""符"');
	});

	it("改行を含むフィールドをダブルクォートで囲む", () => {
		expect(escapeCsvField("行1\n行2")).toBe('"行1\n行2"');
	});
});

describe("formatYayoi", () => {
	it("正常な取引データからCSVを生成する", () => {
		const csv = formatYayoi([sampleTx]);
		const lines = csv.split("\n");
		expect(lines[0]).toBe("仕訳日付,借方勘定科目,借方金額,貸方勘定科目,貸方金額,摘要");
		expect(lines[1]).toBe("2026-01-15,通信費,5000,普通預金,5000,AWS利用料");
	});

	it("空配列ではヘッダーのみ返す", () => {
		const csv = formatYayoi([]);
		expect(csv).toBe("仕訳日付,借方勘定科目,借方金額,貸方勘定科目,貸方金額,摘要");
	});

	it("摘要にカンマを含む場合エスケープされる", () => {
		const tx: ExportTransaction = { ...sampleTx, description: "備品,キーボード" };
		const csv = formatYayoi([tx]);
		const lines = csv.split("\n");
		expect(lines[1]).toContain('"備品,キーボード"');
	});
});

describe("formatFreee", () => {
	it("税区分付きで正常にCSVを生成する", () => {
		const csv = formatFreee([sampleTx]);
		const lines = csv.split("\n");
		expect(lines[0]).toBe("日付,借方勘定科目,借方金額,貸方勘定科目,貸方金額,摘要,税区分");
		expect(lines[1]).toBe("2026-01-15,通信費,5000,普通預金,5000,AWS利用料,課税仕入10%");
	});

	it("tax_categoryがnullの場合税区分が空文字になる", () => {
		const csv = formatFreee([sampleTx2]);
		const lines = csv.split("\n");
		expect(lines[1]).toBe("2026-01-20,旅費交通費,320,現金,320,電車代,");
	});

	it("摘要にダブルクォートを含む場合エスケープされる", () => {
		const tx: ExportTransaction = { ...sampleTx, description: '商品"A"購入' };
		const csv = formatFreee([tx]);
		expect(csv).toContain('"商品""A""購入"');
	});
});

describe("formatGeneric", () => {
	it("正常な取引データから列順が正しいCSVを生成する", () => {
		const csv = formatGeneric([sampleTx]);
		const lines = csv.split("\n");
		expect(lines[0]).toBe("日付,摘要,借方科目,借方金額,貸方科目,貸方金額");
		expect(lines[1]).toBe("2026-01-15,AWS利用料,通信費,5000,普通預金,5000");
	});

	it("空配列ではヘッダーのみ返す", () => {
		const csv = formatGeneric([]);
		expect(csv).toBe("日付,摘要,借方科目,借方金額,貸方科目,貸方金額");
	});

	it("不明な勘定科目コードはそのまま出力される", () => {
		const tx: ExportTransaction = { ...sampleTx, debit_account: "UNKNOWN" };
		const csv = formatGeneric([tx]);
		const lines = csv.split("\n");
		expect(lines[1]).toContain("UNKNOWN");
	});
});

describe("formatTransactions", () => {
	it("BOM付きでフォーマットに応じたCSVを生成する", () => {
		const csv = formatTransactions("yayoi", [sampleTx]);
		expect(csv.startsWith("\uFEFF")).toBe(true);
		expect(csv).toContain("仕訳日付");

		const csvFreee = formatTransactions("freee", [sampleTx]);
		expect(csvFreee).toContain("税区分");

		const csvGeneric = formatTransactions("generic", [sampleTx]);
		expect(csvGeneric).toContain("日付,摘要");
	});
});
