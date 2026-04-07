"use server";

import { revalidatePath } from "next/cache";
import { handleApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import type { Tables } from "@/lib/types/supabase";
import {
	createTaxReliefSchema,
	deleteTaxReliefSchema,
	getTaxReliefsSchema,
	updateTaxReliefSchema,
} from "@/lib/validators/tax-relief";

type TaxReliefRecord = Tables<"tax_relief_records">;

export async function getTaxReliefs(params: {
	assessment_year: string;
}): Promise<ApiResponse<TaxReliefRecord[]>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = getTaxReliefsSchema.safeParse(params);
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("tax_relief_records")
			.select("*")
			.eq("user_id", authResult.data.id)
			.eq("assessment_year", parsed.data.assessment_year)
			.is("deleted_at", null)
			.order("receipt_date", { ascending: false });

		if (error) return handleApiError(error);

		return { success: true, data: data ?? [] };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function createTaxRelief(params: {
	relief_code: string;
	assessment_year: string;
	amount: number;
	receipt_date: string;
	description?: string;
}): Promise<ApiResponse<TaxReliefRecord>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = createTaxReliefSchema.safeParse(params);
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("tax_relief_records")
			.insert({
				user_id: authResult.data.id,
				relief_code: parsed.data.relief_code,
				assessment_year: parsed.data.assessment_year,
				amount: parsed.data.amount,
				receipt_date: parsed.data.receipt_date,
				description: parsed.data.description ?? null,
			})
			.select("*")
			.single();

		if (error) return handleApiError(error);

		revalidatePath("/tax-reliefs");
		return { success: true, data };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function updateTaxRelief(params: {
	id: string;
	relief_code?: string;
	assessment_year?: string;
	amount?: number;
	receipt_date?: string;
	description?: string;
}): Promise<ApiResponse<TaxReliefRecord>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = updateTaxReliefSchema.safeParse(params);
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const { id, ...fields } = parsed.data;
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("tax_relief_records")
			.update({ ...fields, updated_at: new Date().toISOString() })
			.eq("id", id)
			.eq("user_id", authResult.data.id)
			.select("*")
			.single();

		if (error) return handleApiError(error);

		revalidatePath("/tax-reliefs");
		return { success: true, data };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function deleteTaxRelief(id: string): Promise<ApiResponse<null>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = deleteTaxReliefSchema.safeParse({ id });
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const supabase = await createClient();
		const { error } = await supabase
			.from("tax_relief_records")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", parsed.data.id)
			.eq("user_id", authResult.data.id);

		if (error) return handleApiError(error);

		revalidatePath("/tax-reliefs");
		return { success: true, data: null };
	} catch (error) {
		return handleApiError(error);
	}
}
