"use server";

import { revalidatePath } from "next/cache";
import { handleApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import { updateProfileSchema } from "@/lib/validators/profile";

interface ProfileData {
	display_name: string | null;
	fiscal_year_start: number;
	default_tax_rate: string;
}

export async function updateProfile(formData: FormData): Promise<ApiResponse<null>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const parsed = updateProfileSchema.safeParse({
			displayName: formData.get("displayName") || undefined,
			fiscalYearStart: Number(formData.get("fiscalYearStart")),
			defaultTaxRate: formData.get("defaultTaxRate"),
		});

		if (!parsed.success) {
			return {
				success: false,
				error: "入力内容を確認してください。",
				code: "VALIDATION_ERROR",
			};
		}

		const supabase = await createClient();
		const { error } = await supabase
			.from("profiles")
			.update({
				display_name: parsed.data.displayName ?? null,
				fiscal_year_start: parsed.data.fiscalYearStart,
				default_tax_rate: parsed.data.defaultTaxRate,
			})
			.eq("id", authResult.data.id);

		if (error) {
			return handleApiError(error);
		}

		revalidatePath("/settings");
		return { success: true, data: null };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function getProfile(): Promise<ApiResponse<ProfileData>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const supabase = await createClient();
		const { data, error } = await supabase
			.from("profiles")
			.select("display_name, fiscal_year_start, default_tax_rate")
			.eq("id", authResult.data.id)
			.single();

		if (error) {
			return handleApiError(error);
		}

		return { success: true, data };
	} catch (error) {
		return handleApiError(error);
	}
}
