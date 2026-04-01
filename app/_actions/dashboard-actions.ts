"use server";

import { endOfMonth, parse, startOfMonth } from "date-fns";
import { z } from "zod";
import { handleApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import { ACCOUNT_CATEGORIES, CURRENCY_SYMBOLS } from "@/lib/utils/constants";

const dashboardParamsSchema = z.object({
	month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "月はYYYY-MM形式で入力してください"),
});

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
	currencySummary: {
		currency: string;
		symbol: string;
		income: number;
		expense: number;
		balance: number;
	}[];
};

export async function getDashboardData(params: {
	month: string;
}): Promise<ApiResponse<DashboardData>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = dashboardParamsSchema.safeParse(params);
		if (!parsed.success) {
			return {
				success: false,
				error: "月はYYYY-MM形式で入力してください。",
				code: "VALIDATION_ERROR",
			};
		}

		const supabase = await createClient();
		const userId = authResult.data.id;
		const monthDate = parse(parsed.data.month, "yyyy-MM", new Date());
		const monthStart = startOfMonth(monthDate).toISOString().split("T")[0];
		const monthEnd = endOfMonth(monthDate).toISOString().split("T")[0];

		const { data: transactions, error: txError } = await supabase
			.from("transactions")
			.select(
				"amount, debit_account, credit_account, is_confirmed, business_use_ratio, original_currency, original_amount",
			)
			.eq("user_id", userId)
			.gte("transaction_date", monthStart)
			.lte("transaction_date", monthEnd)
			.is("deleted_at", null);

		if (txError) throw txError;

		let income = 0;
		let expense = 0;
		const expenseMap = new Map<string, number>();
		const currencyMap = new Map<string, { income: number; expense: number }>();
		let unconfirmedCount = 0;

		for (const tx of transactions ?? []) {
			const debitInfo = ACCOUNT_CATEGORIES[tx.debit_account as keyof typeof ACCOUNT_CATEGORIES];
			const creditInfo = ACCOUNT_CATEGORIES[tx.credit_account as keyof typeof ACCOUNT_CATEGORIES];
			const ratio = tx.business_use_ratio ?? 100;

			const currency = (tx.original_currency ?? "JPY") as string;
			const originalAmount = (tx.original_amount ?? tx.amount) as number;
			const currencyEntry = currencyMap.get(currency) ?? { income: 0, expense: 0 };

			if (debitInfo?.type === "expense") {
				const deductible = Math.floor((tx.amount * ratio) / 100);
				expense += deductible;
				expenseMap.set(tx.debit_account, (expenseMap.get(tx.debit_account) ?? 0) + deductible);
				currencyEntry.expense += Math.floor((originalAmount * ratio) / 100);
			} else if (creditInfo?.type === "income") {
				income += tx.amount;
				currencyEntry.income += originalAmount;
			}

			currencyMap.set(currency, currencyEntry);

			if (!tx.is_confirmed) {
				unconfirmedCount++;
			}
		}

		const currencySummary = Array.from(currencyMap.entries())
			.map(([currency, { income: inc, expense: exp }]) => ({
				currency,
				symbol: CURRENCY_SYMBOLS[currency] ?? currency,
				income: inc,
				expense: exp,
				balance: inc - exp,
			}))
			.sort((a, b) => a.currency.localeCompare(b.currency));

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
			.eq("user_id", userId)
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
				month: parsed.data.month,
				income,
				expense,
				balance: income - expense,
				expenseBreakdown,
				unconfirmedCount,
				recentImports,
				currencySummary,
			},
		};
	} catch (error) {
		return handleApiError(error);
	}
}
