import { z } from "zod";

/**
 * CSV インポート対応フォーマット
 */
export type CsvFormat = "wise" | "revolut" | "generic";

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
