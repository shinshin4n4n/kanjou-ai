import { z } from "zod";
import { normalizeDate, type ParsedTransaction, parseAmount, splitCsvLine } from "./types";

/**
 * 汎用CSV カラム定義（最低限: 日付, 摘要, 金額）
 */
export const genericRowSchema = z.object({
	date: z.string().min(1),
	description: z.string().min(1),
	amount: z.string().min(1),
});

/**
 * 汎用CSVをパースして統一取引データに変換
 */
export function parseGenericCsv(csvText: string): ParsedTransaction[] {
	const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
	if (lines.length < 2) return [];

	const headerLine = lines[0];
	if (!headerLine) return [];
	const headers = splitCsvLine(headerLine);
	const transactions: ParsedTransaction[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		const columns = splitCsvLine(line);
		const row: Record<string, string> = {};
		for (let j = 0; j < headers.length; j++) {
			const key = headers[j];
			if (key === undefined) continue;
			row[key] = columns[j] ?? "";
		}

		const parsed = genericRowSchema.safeParse(row);
		if (!parsed.success) continue;

		const data = parsed.data;
		try {
			transactions.push({
				date: normalizeDate(data.date),
				description: data.description,
				amount: parseAmount(data.amount),
			});
		} catch {
			// 金額パースエラー時はスキップ
		}
	}

	return transactions;
}
