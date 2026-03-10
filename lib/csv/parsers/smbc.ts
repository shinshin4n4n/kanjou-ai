import { z } from "zod";
import { normalizeDate, type ParsedTransaction, parseAmount } from "./types";

/**
 * SMBC（三井住友カード）CSV の内容ベース検出
 * ヘッダー無しのため、行内容のパターンで判定する
 * - 1行目: カラム数 ≤ 4（契約者情報）
 * - 2行目: カラム数 6以上、1列目が YYYY/MM/DD パターン
 */
export function detectSmbcFromContent(lines: string[]): boolean {
	const firstLine = lines[0];
	const secondLine = lines[1];
	if (!firstLine || !secondLine) return false;

	const firstLineColumns = firstLine.split(",").length;
	if (firstLineColumns >= 5) return false;

	const secondLineColumns = secondLine.split(",");
	if (secondLineColumns.length < 6) return false;

	const firstColumn = secondLineColumns[0];
	return firstColumn !== undefined && /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(firstColumn);
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
	const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
	if (lines.length < 2) return [];

	const transactions: ParsedTransaction[] = [];

	// 1行目は契約者情報なのでスキップ（i=1 から開始）
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		const columns = line.split(",");
		if (columns.length < 3) continue;

		const date = columns[0];
		const description = columns[1];
		const amount = columns[2];
		if (!date || !description || !amount) continue;

		const row = { date, description, amount };

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
