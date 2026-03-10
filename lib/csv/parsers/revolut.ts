import { z } from "zod";
import { normalizeDate, type ParsedTransaction, parseAmount, splitCsvLine } from "./types";

/**
 * Revolut CSV カラム定義（英語版）
 * columns: Date, Description, Amount, Currency, Balance
 */
export const revolutRowSchema = z.object({
	Date: z.string().min(1),
	Description: z.string().min(1),
	Amount: z.string().min(1),
	Currency: z.string().min(1),
	Balance: z.string().optional(),
});

/**
 * Revolut CSV カラム定義（日本語版）
 * columns: 種類, サービス, 開始日, 完了日, お取引, 金額, 手数料, 通貨, 状態, 残高
 */
export const revolutRowSchemaJa = z.object({
	開始日: z.string().min(1),
	お取引: z.string().min(1),
	金額: z.string().min(1),
	通貨: z.string().min(1),
	残高: z.string().optional(),
	状態: z.string().optional(),
	手数料: z.string().optional(),
});

/**
 * Revolut CSVをパースして統一取引データに変換
 * 英語版・日本語版の両方に対応
 */
export function parseRevolutCsv(csvText: string): ParsedTransaction[] {
	const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
	if (lines.length < 2) return [];

	const headerLine = lines[0];
	if (!headerLine) return [];
	const headers = splitCsvLine(headerLine);
	const isJapanese = headers.some((h) => h.trim() === "お取引");
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

		if (isJapanese) {
			const parsed = revolutRowSchemaJa.safeParse(row);
			if (!parsed.success) continue;
			const data = parsed.data;
			if (data.状態 && data.状態 !== "完了済み") continue;
			try {
				const amount = parseAmount(data.金額);
				if (amount === 0) continue;
				const fees = data.手数料 ? parseAmount(data.手数料) : 0;
				transactions.push({
					date: normalizeDate(data.開始日),
					description: data.お取引,
					amount,
					originalCurrency: data.通貨,
					fees: fees !== 0 ? fees : undefined,
				});
			} catch {
				// 金額パースエラー時はスキップ
			}
		} else {
			const parsed = revolutRowSchema.safeParse(row);
			if (!parsed.success) continue;
			const data = parsed.data;
			try {
				const amount = parseAmount(data.Amount);
				if (amount === 0) continue;
				transactions.push({
					date: normalizeDate(data.Date),
					description: data.Description,
					amount,
					originalCurrency: data.Currency,
				});
			} catch {
				// 金額パースエラー時はスキップ
			}
		}
	}

	return transactions;
}
