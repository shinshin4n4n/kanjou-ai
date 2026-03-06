"use server";

import { endOfMonth, parse, startOfMonth } from "date-fns";
import { handleApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import { ACCOUNT_CATEGORIES } from "@/lib/utils/constants";

type DashboardData = {
	month: string;
	income: number;
	expense: number;
	balance: number;
	expenseBreakdown: {
		code: string;
		name: string;
		amount: number;
	}[];
	unconfirmedCount: number;
	recentImports: {
		id: string;
		fileName: string;
		status: string;
		rowCount: number | null;
		createdAt: string;
	}[];
};

export async function getDashboardData(params: {
	month: string;
}): Promise<ApiResponse<DashboardData>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const supabase = await createClient();
		const monthDate = parse(params.month, "yyyy-MM", new Date());
		const monthStart = startOfMonth(monthDate).toISOString().split("T")[0];
		const monthEnd = endOfMonth(monthDate).toISOString().split("T")[0];

		const { data: transactions, error: txError } = await supabase
			.from("transactions")
			.select("amount, debit_account, credit_account, is_confirmed")
			.gte("transaction_date", monthStart)
			.lte("transaction_date", monthEnd)
			.is("deleted_at", null);

		if (txError) throw txError;

		let income = 0;
		let expense = 0;
		const expenseMap = new Map<string, number>();
		let unconfirmedCount = 0;

		for (const tx of transactions ?? []) {
			const debitInfo = ACCOUNT_CATEGORIES[tx.debit_account as keyof typeof ACCOUNT_CATEGORIES];
			const creditInfo = ACCOUNT_CATEGORIES[tx.credit_account as keyof typeof ACCOUNT_CATEGORIES];

			if (debitInfo?.type === "expense") {
				expense += tx.amount;
				expenseMap.set(tx.debit_account, (expenseMap.get(tx.debit_account) ?? 0) + tx.amount);
			} else if (creditInfo?.type === "income") {
				income += tx.amount;
			}

			if (!tx.is_confirmed) {
				unconfirmedCount++;
			}
		}

		const expenseBreakdown = Array.from(expenseMap.entries())
			.map(([code, amount]) => ({
				code,
				name: ACCOUNT_CATEGORIES[code as keyof typeof ACCOUNT_CATEGORIES]?.name ?? code,
				amount,
			}))
			.sort((a, b) => b.amount - a.amount);

		const { data: importLogs, error: importError } = await supabase
			.from("import_logs")
			.select("id, file_name, status, row_count, created_at")
			.order("created_at", { ascending: false })
			.limit(5);

		if (importError) throw importError;

		const recentImports = (importLogs ?? []).map((log) => ({
			id: log.id,
			fileName: log.file_name,
			status: log.status,
			rowCount: log.row_count,
			createdAt: log.created_at,
		}));

		return {
			success: true,
			data: {
				month: params.month,
				income,
				expense,
				balance: income - expense,
				expenseBreakdown,
				unconfirmedCount,
				recentImports,
			},
		};
	} catch (error) {
		return handleApiError(error);
	}
}
