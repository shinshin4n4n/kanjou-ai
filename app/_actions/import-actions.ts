"use server";

import { revalidatePath } from "next/cache";
import { handleApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import type { ImportTransactionsInput } from "@/lib/validators/import";
import { importTransactionsSchema } from "@/lib/validators/import";

const DEFAULT_DEBIT = "EXP010";
const DEFAULT_CREDIT = "AST002";

export async function importTransactions(
	input: ImportTransactionsInput,
): Promise<ApiResponse<{ importLogId: string; importedCount: number }>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = importTransactionsSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const supabase = await createClient();
		const userId = authResult.data.id;

		const { data: importLog, error: logError } = await supabase
			.from("import_logs")
			.insert({
				user_id: userId,
				file_name: parsed.data.fileName,
				file_size: parsed.data.fileSize,
				csv_format: parsed.data.csvFormat,
				row_count: parsed.data.transactions.length,
				status: "processing",
			})
			.select()
			.single();

		if (logError) return handleApiError(logError);

		const rows = parsed.data.transactions.map((tx) => ({
			user_id: userId,
			transaction_date: tx.date,
			description: tx.description,
			amount: Math.round(Math.abs(tx.amount)),
			debit_account: DEFAULT_DEBIT,
			credit_account: DEFAULT_CREDIT,
			source: "csv_import" as const,
			import_log_id: importLog.id,
			is_confirmed: false,
			original_amount: tx.originalAmount ?? null,
			original_currency: tx.originalCurrency ?? null,
			exchange_rate: tx.exchangeRate ?? null,
			fees: tx.fees ?? null,
		}));

		const { error: insertError } = await supabase.from("transactions").insert(rows);

		if (insertError) {
			await supabase
				.from("import_logs")
				.update({ status: "failed", error_count: rows.length })
				.eq("id", importLog.id);
			return handleApiError(insertError);
		}

		await supabase
			.from("import_logs")
			.update({ status: "completed", success_count: rows.length })
			.eq("id", importLog.id);

		revalidatePath("/transactions");
		return {
			success: true,
			data: { importLogId: importLog.id, importedCount: rows.length },
		};
	} catch (error) {
		return handleApiError(error);
	}
}
