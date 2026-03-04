"use server";

import { handleApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import {
	createClassificationRuleSchema,
	deleteClassificationRuleSchema,
} from "@/lib/validators/classification-rule";

const MAX_RULES_PER_USER = 20;

export interface ClassificationRule {
	id: string;
	instruction: string;
	created_at: string;
}

export async function getClassificationRules(): Promise<ApiResponse<ClassificationRule[]>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("classification_rules")
			.select("id, instruction, created_at")
			.eq("user_id", authResult.data.id)
			.order("created_at", { ascending: false })
			.limit(MAX_RULES_PER_USER);

		if (error) return handleApiError(error);

		return { success: true, data: data ?? [] };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function saveClassificationRule(
	instruction: string,
): Promise<ApiResponse<ClassificationRule>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = createClassificationRuleSchema.safeParse({ instruction });
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const supabase = await createClient();

		const { count, error: countError } = await supabase
			.from("classification_rules")
			.select("id", { count: "exact", head: true })
			.eq("user_id", authResult.data.id);

		if (countError) return handleApiError(countError);
		if ((count ?? 0) >= MAX_RULES_PER_USER) {
			return {
				success: false,
				error: `ルールは最大${MAX_RULES_PER_USER}件までです。`,
				code: "VALIDATION_ERROR",
			};
		}

		const { data, error } = await supabase
			.from("classification_rules")
			.insert({
				user_id: authResult.data.id,
				instruction: parsed.data.instruction,
			})
			.select("id, instruction, created_at")
			.single();

		if (error) return handleApiError(error);

		return { success: true, data };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function deleteClassificationRule(id: string): Promise<ApiResponse<null>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = deleteClassificationRuleSchema.safeParse({ id });
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const supabase = await createClient();
		const { error } = await supabase
			.from("classification_rules")
			.delete()
			.eq("id", parsed.data.id)
			.eq("user_id", authResult.data.id);

		if (error) return handleApiError(error);

		return { success: true, data: null };
	} catch (error) {
		return handleApiError(error);
	}
}
