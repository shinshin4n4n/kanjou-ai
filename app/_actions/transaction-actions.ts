"use server";

import { handleApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import type { Tables } from "@/lib/types/supabase";
import { getTransactionsSchema } from "@/lib/validators/transaction";

type Transaction = Tables<"transactions">;

export interface PaginatedTransactions {
	transactions: Transaction[];
	total: number;
	page: number;
	perPage: number;
}

export async function getTransactions(
	params: Record<string, string | undefined>,
): Promise<ApiResponse<PaginatedTransactions>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = getTransactionsSchema.safeParse(params);
		if (!parsed.success) {
			return {
				success: false,
				error: "検索条件を確認してください。",
				code: "VALIDATION_ERROR",
			};
		}

		const { page, perPage, startDate, endDate, isConfirmed, accountCategory, sortBy, sortOrder } =
			parsed.data;

		const supabase = await createClient();

		let query = supabase.from("transactions").select("*", { count: "exact" });

		if (startDate) {
			query = query.gte("transaction_date", startDate);
		}
		if (endDate) {
			query = query.lte("transaction_date", endDate);
		}
		if (isConfirmed !== "all") {
			query = query.eq("is_confirmed", isConfirmed === "true");
		}
		if (accountCategory) {
			query = query.or(`debit_account.eq.${accountCategory},credit_account.eq.${accountCategory}`);
		}

		query = query.order(sortBy, { ascending: sortOrder === "asc" });

		const from = (page - 1) * perPage;
		const to = from + perPage - 1;
		const { data, error, count } = await query.range(from, to);

		if (error) return handleApiError(error);

		return {
			success: true,
			data: {
				transactions: data ?? [],
				total: count ?? 0,
				page,
				perPage,
			},
		};
	} catch (error) {
		return handleApiError(error);
	}
}
