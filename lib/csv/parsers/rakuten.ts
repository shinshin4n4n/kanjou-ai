import { z } from "zod";
import { normalizeDate, type ParsedTransaction, parseAmount, splitCsvLine } from "./types";

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
 * 楽天カード CSVをパースして統一取引データに変換
 */
export function parseRakutenCsv(csvText: string): ParsedTransaction[] {
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
