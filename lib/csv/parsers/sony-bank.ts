import { z } from "zod";
import { normalizeDate, type ParsedTransaction, parseAmount, splitCsvLine } from "./types";

const sonyBankRowSchema = z.object({
	date: z.string().min(1),
	description: z.string().min(1),
});

/**
 * ソニー銀行 CSVをパースして統一取引データに変換
 * ヘッダー: お取引日,摘要,お引出し金額,お預入れ金額,残高,メモ
 */
export function parseSonyBankCsv(csvText: string): ParsedTransaction[] {
	const cleaned = csvText.replace(/^\uFEFF/, "");
	const lines = cleaned.split(/\r?\n/).filter((line) => line.trim() !== "");
	if (lines.length < 2) return [];

	const transactions: ParsedTransaction[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		const columns = splitCsvLine(line);
		if (columns.length < 4) continue;

		const date = columns[0]?.trim();
		const description = columns[1]?.trim();
		const withdrawal = columns[2]?.trim();
		const deposit = columns[3]?.trim();

		if (!date || !description) continue;

		const parsed = sonyBankRowSchema.safeParse({ date, description });
		if (!parsed.success) continue;

		if (!withdrawal && !deposit) continue;

		try {
			let amount: number;
			if (withdrawal) {
				amount = -Math.abs(parseAmount(withdrawal));
			} else if (deposit) {
				amount = parseAmount(deposit);
			} else {
				continue;
			}

			transactions.push({
				date: normalizeDate(parsed.data.date),
				description: parsed.data.description,
				amount,
			});
		} catch {
			// 金額パースエラー時はスキップ
		}
	}

	return transactions;
}
