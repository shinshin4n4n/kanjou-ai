"use server";

import { handleApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { formatTransactions } from "@/lib/csv/formatters";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import type { ExportRequestInput } from "@/lib/validators/transaction";
import { exportRequestSchema } from "@/lib/validators/transaction";

export async function exportTransactions(
	input: ExportRequestInput,
): Promise<ApiResponse<{ csv: string; count: number }>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = exportRequestSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const { format, startDate, endDate, confirmedOnly } = parsed.data;
		const supabase = await createClient();

		let query = supabase
			.from("transactions")
			.select("transaction_date, description, amount, debit_account, credit_account, tax_category")
			.is("deleted_at", null)
			.gte("transaction_date", startDate)
			.lte("transaction_date", endDate);

		if (confirmedOnly) {
			query = query.eq("is_confirmed", true);
		}

		const { data, error } = await query.order("transaction_date", { ascending: true });

		if (error) return handleApiError(error);

		if (!data || data.length === 0) {
			return {
				success: false,
				error: "エクスポート対象の取引がありません。",
				code: "EXPORT_ERROR",
			};
		}

		const csv = formatTransactions(format, data);
		return { success: true, data: { csv, count: data.length } };
	} catch (error) {
		return handleApiError(error);
	}
}
