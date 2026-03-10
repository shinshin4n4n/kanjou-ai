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
 * 日付文字列をYYYY-MM-DD形式に正規化
 */
export function normalizeDate(dateStr: string): string {
	// DD-MM-YYYY or DD/MM/YYYY
	const dmyMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
	if (dmyMatch) {
		const [, day = "", month = "", year = ""] = dmyMatch;
		return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
	}

	// YYYY/MM/DD (Japanese card statements)
	const ymdSlashMatch = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
	if (ymdSlashMatch) {
		const [, year = "", month = "", day = ""] = ymdSlashMatch;
		return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
	}

	// YYYY-MM-DD (already correct)
	const ymdMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (ymdMatch) {
		return dateStr.substring(0, 10);
	}

	// ISO format: 2025-01-15T10:30:00Z
	const isoMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})T/);
	if (isoMatch?.[1]) {
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
 * ダブルクォートで囲まれたCSVフィールドを分割（RFC 4180 準拠）
 * - ダブルクォート内のカンマはフィールド区切りとして扱わない
 * - エスケープクォート（""）は単一の " に変換
 */
export function splitCsvLine(line: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i] ?? "";
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
