"use server";

import { revalidatePath } from "next/cache";
import { handleApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { classifyTransactions } from "@/lib/claude/client";
import type { ClassifiedTransaction } from "@/lib/claude/types";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import { bulkConfirmSchema } from "@/lib/validators/transaction";

const CONFIDENCE_SCORE: Record<string, number> = {
	HIGH: 0.9,
	MEDIUM: 0.6,
	LOW: 0.3,
};

export async function runAiClassification(
	ids: string[],
): Promise<ApiResponse<ClassifiedTransaction[]>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = bulkConfirmSchema.safeParse({ ids });
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		if (ids.length > 50) {
			return {
				success: false,
				error: "一度に処理できるのは50件までです。",
				code: "VALIDATION_ERROR",
			};
		}

		const supabase = await createClient();
		const { data: transactions, error: fetchError } = await supabase
			.from("transactions")
			.select("*")
			.in("id", parsed.data.ids);

		if (fetchError) return handleApiError(fetchError);
		if (!transactions || transactions.length === 0) {
			return { success: false, error: "対象の取引が見つかりません。", code: "VALIDATION_ERROR" };
		}

		const inputs = transactions.map((tx) => ({
			id: tx.id,
			date: tx.transaction_date,
			description: tx.description,
			amount: tx.amount,
		}));

		const classifyResult = await classifyTransactions(inputs);
		if (!classifyResult.success) {
			return {
				success: false,
				error: "AI仕訳推定に失敗しました。",
				code: "AI_ERROR",
			};
		}

		for (const classification of classifyResult.data) {
			if (!classification.id) continue;
			const score = CONFIDENCE_SCORE[classification.confidence] ?? 0;
			const { error: updateError } = await supabase
				.from("transactions")
				.update({
					debit_account: classification.debitAccount,
					credit_account: classification.creditAccount,
					ai_suggested: true,
					ai_confidence: score,
				})
				.eq("id", classification.id);
			if (updateError) return handleApiError(updateError);
		}

		revalidatePath("/transactions");
		return { success: true, data: classifyResult.data };
	} catch (error) {
		return handleApiError(error);
	}
}
