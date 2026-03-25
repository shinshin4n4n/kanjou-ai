export { genericRowSchema, parseGenericCsv } from "./generic";
export { parseRakutenCsv, rakutenRowSchema } from "./rakuten";
export {
	parseRevolutCsv,
	revolutRowSchema,
	revolutRowSchemaJa,
} from "./revolut";
export { detectSmbcFromContent, parseSmbcCsv } from "./smbc";
export { parseSonyBankCsv } from "./sony-bank";
export type { CsvFormat, ParsedTransaction } from "./types";
export { normalizeDate, parseAmount, splitCsvLine } from "./types";
export { parseWiseCsv, wiseRowSchema } from "./wise";

import { parseGenericCsv } from "./generic";
import { parseRakutenCsv } from "./rakuten";
import { parseRevolutCsv } from "./revolut";
import { detectSmbcFromContent, parseSmbcCsv } from "./smbc";
import { parseSonyBankCsv as parseSonyBank } from "./sony-bank";
import type { CsvFormat, ParsedTransaction } from "./types";
import { splitCsvLine } from "./types";
import { parseWiseCsv } from "./wise";

/**
 * CSVヘッダーからフォーマットを自動判定
 */
export function detectCsvFormat(headers: string[]): CsvFormat {
	const normalized = headers.map((h) => h.trim().toLowerCase());

	if (normalized.includes("transferwise id")) {
		return "wise";
	}

	// 楽天カード: 「利用店名・商品名」カラムの存在で判定
	if (headers.some((h) => h.trim() === "利用店名・商品名")) {
		return "rakuten";
	}

	// Revolut（日本語版）: お取引, 金額, 通貨 の組み合わせ
	if (
		headers.some((h) => h.trim() === "お取引") &&
		headers.some((h) => h.trim() === "金額") &&
		headers.some((h) => h.trim() === "通貨")
	) {
		return "revolut";
	}

	// Revolut（英語版）: Date, Description, Amount, Currency, Balance の組み合わせ
	if (
		normalized.includes("date") &&
		normalized.includes("description") &&
		normalized.includes("amount") &&
		normalized.includes("currency") &&
		normalized.includes("balance")
	) {
		return "revolut";
	}

	// ソニー銀行: お取引日 + お引出し金額 + お預入れ金額 の組み合わせ
	if (
		headers.some((h) => h.trim() === "お取引日") &&
		headers.some((h) => h.trim() === "お引出し金額") &&
		headers.some((h) => h.trim() === "お預入れ金額")
	) {
		return "sony-bank";
	}

	return "generic";
}

/**
 * CSV テキストを自動判定してパースする統一ディスパッチャー
 */
export function parseCsv(csvText: string): {
	format: CsvFormat;
	transactions: ParsedTransaction[];
} {
	const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
	if (lines.length === 0) return { format: "generic", transactions: [] };

	if (detectSmbcFromContent(lines)) {
		return { format: "smbc", transactions: parseSmbcCsv(csvText) };
	}

	const firstLine = lines[0];
	if (!firstLine) return { format: "generic", transactions: [] };
	const headers = splitCsvLine(firstLine);
	const format = detectCsvFormat(headers);

	switch (format) {
		case "wise":
			return { format, transactions: parseWiseCsv(csvText) };
		case "rakuten":
			return { format, transactions: parseRakutenCsv(csvText) };
		case "revolut":
			return { format, transactions: parseRevolutCsv(csvText) };
		case "sony-bank":
			return { format, transactions: parseSonyBank(csvText) };
		default:
			return { format: "generic", transactions: parseGenericCsv(csvText) };
	}
}
