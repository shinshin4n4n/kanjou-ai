"use server";

import { revalidatePath } from "next/cache";
import { handleApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import type { Tables } from "@/lib/types/supabase";
import type { CreateTransactionInput, UpdateTransactionInput } from "@/lib/validators/transaction";
import {
	bulkConfirmSchema,
	createTransactionSchema,
	getTransactionsSchema,
	transactionIdSchema,
	updateTransactionSchema,
} from "@/lib/validators/transaction";

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

export async function createTransaction(
	input: CreateTransactionInput,
): Promise<ApiResponse<Transaction>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = createTransactionSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("transactions")
			.insert({
				user_id: authResult.data.id,
				transaction_date: parsed.data.transactionDate,
				description: parsed.data.description,
				amount: parsed.data.amount,
				debit_account: parsed.data.debitAccount,
				credit_account: parsed.data.creditAccount,
				tax_category: parsed.data.taxCategory ?? null,
				memo: parsed.data.memo ?? null,
				is_confirmed: false,
				source: "manual",
			})
			.select()
			.single();

		if (error) return handleApiError(error);

		revalidatePath("/transactions");
		return { success: true, data };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function updateTransaction(
	input: UpdateTransactionInput,
): Promise<ApiResponse<Transaction>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = updateTransactionSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const { id, isConfirmed, ...fields } = parsed.data;
		const updateData: Record<string, unknown> = {};
		if (fields.transactionDate !== undefined) updateData.transaction_date = fields.transactionDate;
		if (fields.description !== undefined) updateData.description = fields.description;
		if (fields.amount !== undefined) updateData.amount = fields.amount;
		if (fields.debitAccount !== undefined) updateData.debit_account = fields.debitAccount;
		if (fields.creditAccount !== undefined) updateData.credit_account = fields.creditAccount;
		if (fields.taxCategory !== undefined) updateData.tax_category = fields.taxCategory;
		if (fields.memo !== undefined) updateData.memo = fields.memo;
		if (isConfirmed !== undefined) updateData.is_confirmed = isConfirmed;

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("transactions")
			.update(updateData)
			.eq("id", id)
			.select()
			.single();

		if (error) return handleApiError(error);

		revalidatePath("/transactions");
		return { success: true, data };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function softDeleteTransaction(id: string): Promise<ApiResponse<Transaction>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = transactionIdSchema.safeParse(id);
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("transactions")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", parsed.data)
			.select()
			.single();

		if (error) return handleApiError(error);

		revalidatePath("/transactions");
		return { success: true, data };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function confirmTransaction(id: string): Promise<ApiResponse<Transaction>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = transactionIdSchema.safeParse(id);
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("transactions")
			.update({ is_confirmed: true })
			.eq("id", parsed.data)
			.select()
			.single();

		if (error) return handleApiError(error);

		revalidatePath("/transactions");
		return { success: true, data };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function bulkConfirmTransactions(ids: string[]): Promise<ApiResponse<Transaction[]>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = bulkConfirmSchema.safeParse({ ids });
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("transactions")
			.update({ is_confirmed: true })
			.in("id", parsed.data.ids)
			.select();

		if (error) return handleApiError(error);

		revalidatePath("/transactions");
		return { success: true, data: data ?? [] };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function getTransaction(id: string): Promise<ApiResponse<Transaction>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const supabase = await createClient();
		const { data, error } = await supabase.from("transactions").select("*").eq("id", id).single();

		if (error) return handleApiError(error);

		return { success: true, data };
	} catch (error) {
		return handleApiError(error);
	}
}
