import { z } from "zod";

/**
 * CSV インポート対応フォーマット
 */
export type CsvFormat = "wise" | "revolut" | "smbc" | "rakuten" | "generic";

/**
 * パース後の統一取引データ
 */
export type ParsedTransaction = {
	date: string; // YYYY-MM-DD
	description: string;
	amount: number; // 円換算後の整数
	originalAmount?: number;
	originalCurrency?: string;
	exchangeRate?: number;
	fees?: number;
	payeeName?: string;
	reference?: string;
};

/**
 * Wise CSV カラム定義
 * columns: TransferWise ID, Date, Amount, Currency, Description,
 *          Payment Reference, Running Balance, Exchange From, Exchange To,
 *          Exchange Rate, Payer Name, Payee Name, Payee Account Number,
 *          Merchant, Card Last Four Digits, Card Holder Full Name,
 *          Attachment, Note, Total fees
 */
export const wiseRowSchema = z.object({
	"TransferWise ID": z.string(),
	Date: z.string().min(1),
	Amount: z.string().min(1),
	Currency: z.string().min(1),
	Description: z.string(),
	"Payment Reference": z.string().optional(),
	"Running Balance": z.string().optional(),
	"Exchange From": z.string().optional(),
	"Exchange To": z.string().optional(),
	"Exchange Rate": z.string().optional(),
	"Payer Name": z.string().optional(),
	"Payee Name": z.string().optional(),
	"Total fees": z.string().optional(),
});

/**
 * Revolut CSV カラム定義
 * columns: Date, Description, Amount, Currency, Balance
 * Note: UTC/ローカル時刻の両方が含まれる場合あり
 */
export const revolutRowSchema = z.object({
	Date: z.string().min(1),
	Description: z.string().min(1),
	Amount: z.string().min(1),
	Currency: z.string().min(1),
	Balance: z.string().optional(),
});

/**
 * 汎用CSV カラム定義（最低限: 日付, 摘要, 金額）
 */
export const genericRowSchema = z.object({
	date: z.string().min(1),
	description: z.string().min(1),
	amount: z.string().min(1),
});

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

	// Revolut: Date, Description, Amount, Currency, Balance の組み合わせ
	if (
		normalized.includes("date") &&
		normalized.includes("description") &&
		normalized.includes("amount") &&
		normalized.includes("currency") &&
		normalized.includes("balance")
	) {
		return "revolut";
	}

	return "generic";
}

/**
 * 日付文字列をYYYY-MM-DD形式に正規化
 */
export function normalizeDate(dateStr: string): string {
	// DD-MM-YYYY or DD/MM/YYYY
	const dmyMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
	if (dmyMatch) {
		const [, day, month, year] = dmyMatch;
		return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
	}

	// YYYY/MM/DD (Japanese card statements)
	const ymdSlashMatch = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
	if (ymdSlashMatch) {
		const [, year, month, day] = ymdSlashMatch;
		return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
	}

	// YYYY-MM-DD (already correct)
	const ymdMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (ymdMatch) {
		return dateStr.substring(0, 10);
	}

	// ISO format: 2025-01-15T10:30:00Z
	const isoMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})T/);
	if (isoMatch) {
		return isoMatch[1];
	}

	return dateStr;
}

/**
 * 金額文字列を整数（円単位）にパース
 */
export function parseAmount(amountStr: string): number {
	const cleaned = amountStr.replace(/[,\s]/g, "");
	const num = Number.parseFloat(cleaned);
	if (Number.isNaN(num)) {
		throw new Error(`Invalid amount: ${amountStr}`);
	}
	return Math.round(num);
}

/**
 * 楽天カード CSV カラム定義
 * columns: 利用日, 利用店名・商品名, 利用者, 支払方法, 利用金額, 支払手数料, 支払総額
 */
export const rakutenRowSchema = z
	.object({
		利用日: z.string().min(1),
		"利用店名・商品名": z.string().min(1),
		利用金額: z.string().min(1),
	})
	.passthrough();

/**
 * ダブルクォートで囲まれたCSVフィールドを分割（RFC 4180 準拠）
 * - ダブルクォート内のカンマはフィールド区切りとして扱わない
 * - エスケープクォート（""）は単一の " に変換
 */
function splitCsvLine(line: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === "," && !inQuotes) {
			fields.push(current);
			current = "";
		} else {
			current += char;
		}
	}
	fields.push(current);
	return fields;
}

/**
 * 楽天カード CSVをパースして統一取引データに変換
 */
export function parseRakutenCsv(csvText: string): ParsedTransaction[] {
	const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
	if (lines.length < 2) return [];

	const headers = splitCsvLine(lines[0]);
	const transactions: ParsedTransaction[] = [];

	for (let i = 1; i < lines.length; i++) {
		const columns = splitCsvLine(lines[i]);
		const row: Record<string, string> = {};
		for (let j = 0; j < headers.length; j++) {
			row[headers[j]] = columns[j] ?? "";
		}

		const parsed = rakutenRowSchema.safeParse(row);
		if (!parsed.success) continue;

		const data = parsed.data;
		transactions.push({
			date: normalizeDate(data.利用日),
			description: data["利用店名・商品名"],
			amount: parseAmount(data.利用金額),
		});
	}

	return transactions;
}

/**
 * SMBC（三井住友カード）CSV の内容ベース検出
 * ヘッダー無しのため、行内容のパターンで判定する
 * - 1行目: カラム数 ≤ 4（契約者情報）
 * - 2行目: カラム数 6以上、1列目が YYYY/MM/DD パターン
 */
export function detectSmbcFromContent(lines: string[]): boolean {
	if (lines.length < 2) return false;

	const firstLineColumns = lines[0].split(",").length;
	if (firstLineColumns >= 5) return false;

	const secondLineColumns = lines[1].split(",");
	if (secondLineColumns.length < 6) return false;

	return /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(secondLineColumns[0]);
}

/**
 * SMBC CSV カラム定義（列インデックスベース）
 * columns: 利用日[0], ご利用先[1], 利用金額[2], 支払区分[3], 支払金額[4], ...
 */
const smbcRowSchema = z.object({
	date: z.string().min(1),
	description: z.string().min(1),
	amount: z.string().min(1),
});

/**
 * 三井住友カード CSVをパースして統一取引データに変換
 * 1行目（契約者情報）をスキップ、空行・不正行も除外
 */
export function parseSmbcCsv(csvText: string): ParsedTransaction[] {
	const lines = csvText.split("\n").filter((line) => line.trim() !== "");
	if (lines.length < 2) return [];

	const transactions: ParsedTransaction[] = [];

	// 1行目は契約者情報なのでスキップ（i=1 から開始）
	for (let i = 1; i < lines.length; i++) {
		const columns = lines[i].split(",");
		if (columns.length < 3) continue;

		const row = {
			date: columns[0],
			description: columns[1],
			amount: columns[2],
		};

		const parsed = smbcRowSchema.safeParse(row);
		if (!parsed.success) continue;

		try {
			transactions.push({
				date: normalizeDate(parsed.data.date),
				description: parsed.data.description,
				amount: parseAmount(parsed.data.amount),
			});
		} catch {
			// 金額パースエラー時はスキップ
		}
	}

	return transactions;
}
