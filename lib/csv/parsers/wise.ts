import { z } from "zod";
import { normalizeDate, type ParsedTransaction, parseAmount, splitCsvLine } from "./types";

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
 * Wise CSVをパースして統一取引データに変換
 */
export function parseWiseCsv(csvText: string): ParsedTransaction[] {
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

		const parsed = wiseRowSchema.safeParse(row);
		if (!parsed.success) continue;

		const data = parsed.data;
		try {
			transactions.push({
				date: normalizeDate(data.Date),
				description: data.Description,
				amount: parseAmount(data.Amount),
				originalCurrency: data.Currency,
				exchangeRate: data["Exchange Rate"] ? Number.parseFloat(data["Exchange Rate"]) : undefined,
				payeeName: data["Payee Name"] || undefined,
				reference: data["Payment Reference"] || undefined,
				fees: data["Total fees"] ? parseAmount(data["Total fees"]) : undefined,
			});
		} catch {
			// 金額パースエラー時はスキップ
		}
	}

	return transactions;
}
